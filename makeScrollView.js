var requestAnimationFrame = require('std/requestAnimationFrame')

module.exports = makeScrollView

var tags = require('./tags')
var X = tags.X
var Y = tags.Y

function makeScrollView(opts) {
	opts = options(opts, {
		size:viewport.size(),
		contentSize:null,
		render:null,
		onScroll:null,
		useTranslationScroll: tags.isTouch
	})
	
	var uid = tags.uid()
	var touch = _makeTouch([0,0], false)
	var translationScrollOffset = [0,0]
	var scroll = [0,0]
	var velocity = [0,0]
	var velocityDivison = 180
	var visibleDelta = 1/window.devicePixelRatio
	
	var overflowStyle = (opts.useTranslationScroll
		? { overflow:'hidden' }
		: (tags.isTouch ? { '-webkit-overflow-scrolling':'touch' } : { overflow:'auto' })
	)
	var scrollView = div('tags-scrollView',
		attr({ id:uid }), tags.destructible(_destroy),
		style(opts.size, absolute, translate(0,0), overflowStyle),
		div('tags-content',
			style(absolute(0,0), translate(0,0), opts.contentSize),
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
		
		if (velocity[Y]) {
			touch.isAccellerating = true
			touch.accellerateTimeout = after(20, function() {
				touch.isAccellerating = false
				velocity[Y] = 0
			})
		}
		
		_startRequestingAnimationFrames()
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
			incorporatedOffset: [0,0]
		}
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
		touch.isActive = false
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
		
		touch.isActive = false
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
		
		var touchOffsetDelta = (touch.offset[Y] - touch.incorporatedOffset[Y])
		if (velocity[Y] || touchOffsetDelta) {
			translationScrollOffset[X] += 0
			translationScrollOffset[Y] += (velocity[Y] * dt + touchOffsetDelta)
			touch.incorporatedOffset[Y] = touch.offset[Y]
			
			var delta = [
				scroll[X] - translationScrollOffset[X],
				scroll[Y] - translationScrollOffset[Y],
			]
			
			if (Math.abs(delta[X]) >= visibleDelta || Math.abs(delta[Y]) >= visibleDelta) {
				scroll[X] = translationScrollOffset[X]
				scroll[Y] = translationScrollOffset[Y]
				_onScroll()
				scrollView.content.el.style.webkitTransform = 'translate3d('+(-scroll[X])+'px,'+(-scroll[Y])+'px,0)'
			}
		}
		
		if (!touch.isActive || touch.isAccellerating) {
			velocity[Y] *= clip(60 / dt, 0, 1) * 0.975
		} 
		
		// Cut off early, the last fraction of velocity doesn't have much impact on movement
		if (Math.abs(velocity[Y]) < 0.005) {
			velocity[Y] = 0
		}
		
		if (velocity[Y] || touch.isActive) {
			requestAnimationFrame(_tickUpdateTranslation)
		} else {
			_tickUpdateTranslation.lastTimestamp = null
		}
	}
}