var requestAnimationFrame = require('std/requestAnimationFrame')

module.exports = makeScrollView

var tags = require('./tags')
var X = tags.X
var Y = tags.Y
var A = tags.A
var B = tags.B
var isZero = tags.pos.isZero

function makeScrollView(opts) {
	opts = options(opts, {
		size:viewport.size(),
		contentSize:null,
		render:null,
		onScroll:null,
		useTranslationScroll: tags.isTouch
	})
	
	var uid = tags.uid()
	var translationOffset = [0,0] // internal representation of offset
	var lastIndependentOffset = [0,0]
	var naturalOffset = [0,0]
	var scroll = [0,0] // externally visible amount scrolled
	var velocity = [0,0]
	var bounds = [
		[0, opts.contentSize.width],
		[0, opts.contentSize.height - opts.size.height]
	]
	var touch = _makeTouch([0,0], false)
	var velocityDivison = 180
	var visibleChange = 1/window.devicePixelRatio
	
	var overflowStyle = (opts.useTranslationScroll
		? { overflow:'hidden' }
		: (tags.isTouch ? { '-webkit-overflow-scrolling':'touch' } : { overflow:'auto' })
	)
	var scrollView = div('tags-scrollView',
		attr({ id:uid }), tags.destructible(_destroy),
		style(opts.size, absolute, translate(0,0), overflowStyle),
		div('tags-content',
			style(absolute(0,0), translate(0,0), opts.contentSize, { overflow:'hidden' }),
			opts.render
		)
	)
	
	nextTick(_init)
	return setProps(scrollView, {
		scroll: scroll,
		velocity: velocity,
		select: _select
	})
	
	function _select() {
		var args = [uid].concat(slice(arguments))
		return tags.byId.apply(this, args)
	}
	
	function _init() {
		scrollView.content = tags.byId(uid, '.tags-content')
		
		if (opts.useTranslationScroll) {
			_setupTranslationScroll()
		} else {
			_setupNativeScroll()
		}
		
		_onScroll()
	}
	
	function _onScroll() {
		opts.onScroll(scrollView)
	}
	
	function _setupNativeScroll() {
		tags.byId(uid).on('scroll', function(e) {
			scroll[X] = this.scrollLeft
			scroll[Y] = this.scrollTop
			_onScroll()
		})
	}
	
	function _setupTranslationScroll() {
		tags.byId(uid)
			.on(tags.events.start, _onTouchStart)
			.on(tags.events.move, _onTouchMove)
			.on(tags.events.cancel, _onTouchCancel)
			.on(tags.events.end, _onTouchEnd)
	}
	
	function _destroy() {
		scrollView = null
		
		tags.byId(uid)
			.off(tags.events.start, _onTouchStart)
			.off(tags.events.move, _onTouchMove)
			.off(tags.events.cancel, _onTouchCancel)
			.off(tags.events.end, _onTouchEnd)
	}
	
	function _onTouchStart(e) {
		if (tags.events.numPointers(e) > 1) { return }
		touch = _makeTouch(tags.events.clientPosition(e), true)
		
		if (!isZero(velocity)) {
			touch.isAccellerating = true
			touch.accellerateTimeout = after(20, function() {
				touch.isAccellerating = false
				velocity[Y] = 0
			})
		}
		
		_startRequestingAnimationFrames()
	}
	
	function _onTouchMove(e) {
		if (!touch.isActive) { return }
		var nextPrevious = touch.current
		var pos = tags.events.clientPosition(e)
		
		touch.current = pos
		touch.lastMove = Date.now()
		
		var accellerateSameDirection = (
			(touch.current[Y] > touch.previous[Y] && velocity[Y] < 0)
			|| (touch.current[Y] < touch.previous[Y] && velocity[Y] > 0)
		)
		
		var moveNewDirection = (touch.direction[Y] > 0
			? touch.current[Y] < touch.previous[Y]
			: touch.current[Y] > touch.previous[Y]
		)
		if (moveNewDirection) {
			touch.direction[Y] = (touch.current[Y] > touch.previous[Y] ? 1 : -1)
			touch.startDirection = [pos[X],pos[Y]]
		}
		
		if (touch.isAccellerating && accellerateSameDirection) {
			clearTimeout(touch.accellerateTimeout)
			velocity[Y] += (touch.previous[Y] - touch.current[Y]) / velocityDivison
		} else {
			velocity[Y] = 0
			touch.isAccellerating = false
			touch.offset[Y] = touch.start[Y] - touch.current[Y]
		}
		
		touch.previous = nextPrevious
	}
	
	function _onTouchCancel(e) {
		_onTouchFinished()
	}
	
	function _onTouchEnd(e) {
		if (!touch.isAccellerating) {
			velocity[Y] = (touch.startDirection[Y] - touch.current[Y]) / velocityDivison
		}
		
		// If the finger was still at the end then stop scrolling
		var dt = Date.now() - touch.lastMove
		if (dt > 200 || Math.abs(touch.previous[Y] - touch.current[Y]) < 5) {
			velocity[Y] = 0
		}
		
		_onTouchFinished()
	}
	
	function _onTouchFinished() {
		touch.isActive = false
		_setTranslation(naturalOffset[X], naturalOffset[Y])
	}

	function _startRequestingAnimationFrames() {
		if (_tickUpdateTranslation.lastTimestamp) { return }
		requestAnimationFrame(_tickUpdateTranslation)
	}
	
	function _tickUpdateTranslation(timestamp) {
		if (!scrollView) { return }

		var dt = (timestamp - (_tickUpdateTranslation.lastTimestamp || timestamp))
		_tickUpdateTranslation.lastTimestamp = timestamp
		// if (dt >= 20) { log("SLOW FRAME") }
		
		if (!isZero(velocity)) {
			var deceleration = clip(60 / dt, 0, 1) * 0.975
			velocity[X] *= deceleration
			velocity[Y] *= deceleration

			var positionByVelocity = [
				translationOffset[X] + velocity[X] * dt,
				translationOffset[Y] + velocity[Y] * dt,
			]
			var excess = _boundsExcess(positionByVelocity)
			
			naturalOffset[X] = positionByVelocity[X] - excess[X]
			naturalOffset[Y] = positionByVelocity[Y] - excess[Y]
			
			if (isZero(excess)) {
				_setTranslation(positionByVelocity[X], positionByVelocity[Y])
			} else {
				var resistance = _excessResistence(excess)
				_setTranslation(
					naturalOffset[X] + excess[X] / resistance[X],
					naturalOffset[Y] + excess[Y] / resistance[Y]
				)
			}
		} else if (touch.isActive) {
			var positionByDrag = [
				touch.naturalOffsetAtStart[X] + touch.offset[X],
				touch.naturalOffsetAtStart[Y] + touch.offset[Y]
			]
			var excess = _boundsExcess(positionByDrag)
			naturalOffset[X] = positionByDrag[X] - excess[X]
			naturalOffset[Y] = positionByDrag[Y] - excess[Y]	
			
			if (isZero(excess)) {
				_setTranslation(positionByDrag[X], positionByDrag[Y])
			} else {
				var resistance = _excessResistence(excess)
				_setTranslation(
					naturalOffset[X] + excess[X] / resistance[X],
					naturalOffset[Y] + excess[Y] / resistance[Y]
				)
			}
		}
		
		// Cut off early, the last fraction of velocity doesn't have much impact on movement
		if (velocity[Y] && Math.abs(velocity[Y]) < 0.005) {
			stop(Y)
		}
		
		if (touch.isActive || !isZero(velocity)) {
			// keep animating as long as user is actively touching or the view has a velocity
			requestAnimationFrame(_tickUpdateTranslation)
		} else {
			_tickUpdateTranslation.lastTimestamp = null
		}
	}
	
	function _excessResistence(excess) {
		var distance = tags.pos.abs(excess)
		return [ // resistence grows with distance
			distance[X] <= 1 ? 1 : 1 + Math.log(1 + distance[X] / 100),
			distance[Y] <= 1 ? 1 : 1 + Math.log(1 + distance[Y] / 100)
		]
	}
	
	function _boundsExcess(position) {
		return [
			_displacementFromRange(position[X], bounds[X]),
			_displacementFromRange(position[Y], bounds[Y]),
		]
	}
	
	function _setTranslation(x,y) {
		translationOffset[X] = x
		translationOffset[Y] = y
		_onTranslationChange()
	}
	function _onTranslationChange() {
		var scrollChange = [
			scroll[X] - translationOffset[X],
			scroll[Y] - translationOffset[Y],
		]
		if (Math.abs(scrollChange[X]) >= visibleChange || Math.abs(scrollChange[Y]) >= visibleChange) {
			scroll[X] = translationOffset[X]
			scroll[Y] = translationOffset[Y]
			_onScroll()
			scrollView.content.el.style.webkitTransform = 'translate3d('+(-scroll[X])+'px,'+(-scroll[Y])+'px,0)'
		}
	}
	
	function stop(XorY) {
		velocity[XorY] = 0
		_onTranslationChange()
		touch.isAccellerating = false
	}
	
	function _distanceFromRange(value, range) {
		return Math.abs(_displacementFromRange(value, range))
	}
	
	function _displacementFromRange(value, range) {
		return (
			value < range[A] ? value - range[A]
			: value > range[B] ? value - range[B]
			: 0
		)
	}

	function _makeTouch(pos, active) {
		return {
			lastMove: 0,
			isActive: active,
			start: pos,
			previous: pos,
			current: pos,
			isAccellerating:false,
			offset: [0,0],
			direction: [0,0],
			startDirection: pos,
			naturalOffsetAtStart: [naturalOffset[X], naturalOffset[Y]]
		}
	}

}