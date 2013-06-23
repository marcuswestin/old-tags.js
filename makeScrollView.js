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
	
	var ACCELERATION_FRACTION = 180
	var DECELERATION_RATE = 0.975
	var BOUNCE_BACK_VELOCITY_BY_DISTANCE = 0.01
	var OUT_OF_BOUNDS_SLOWDOWN_RATE = 0.08
	var OUT_OF_BOUNDS_DRAG_DIVIDER = 2
	var VELOCITY_CUTOFF = 0.005

	var uid = tags.uid()
	var contentOffset = [0,0] // visual offset of scroll view content (including "bounce" at bounds)
	var naturalOffset = [0,0] // logical offset of scroll view content (excluding visual "bounce" at bounds)
	var visualScroll = [0,0]  // rendered offset of content (if offset changes by 0.005 the screen shouldn't re-render)
	var smallestVisibleChange = 1 / (tags.pixelRatio * 2) // the smallest offset change that can be visually detected	
	var velocity = [0,0]      // velocity of moving content

	var touch = _makeTouch([0,0], false)
	var bounds = [
		[0, opts.contentSize.width],
		[0, opts.contentSize.height - opts.size.height]
	]
	
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
		scroll: naturalOffset,
		visualScroll: visualScroll,
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
		
		opts.onScroll(scrollView)
	}
	
	function _setupNativeScroll() {
		tags.byId(uid).on('scroll', function(e) {
			naturalOffset[X] = this.scrollLeft
			naturalOffset[Y] = this.scrollTop
			visualScroll[X] = this.scrollLeft
			visualScroll[Y] = this.scrollTop
			opts.onScroll(scrollView)
		})
	}
	
	function _setupTranslationScroll() {
		tags.byId(uid)
			.on(tags.events.start, _onTouchStart)
			.on(tags.events.move, _onTouchMove)
			.on(tags.events.cancel, _onTouchFinished)
			.on(tags.events.end, _onTouchFinished)
	}
	
	function _destroy() {
		scrollView = null
		
		tags.byId(uid)
			.off(tags.events.start, _onTouchStart)
			.off(tags.events.move, _onTouchMove)
			.off(tags.events.cancel, _onTouchFinished)
			.off(tags.events.end, _onTouchFinished)
	}
	
	function _onTouchStart(e) {
		if (tags.events.numPointers(e) > 1) { return }
		touch = _makeTouch(tags.events.clientPosition(e), true)
		
		velocity[X] = 0
		velocity[Y] = 0
		
		_startRequestingAnimationFrames()
	}
	
	function _onTouchMove(e) {
		if (!touch.isTouching) { return }
		
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
		
		if (_isFloating() && accellerateSameDirection) {
			velocity[Y] += (touch.previous[Y] - touch.current[Y]) / ACCELERATION_FRACTION
		} else {
			velocity[Y] = 0
			touch.offset[Y] = touch.start[Y] - touch.current[Y]
		}
		
		touch.previous = nextPrevious
	}
	
	function _onTouchFinished(e) {
		touch.isTouching = false

		var deltaTime = Date.now() - touch.lastMove
		var deltaPos = touch.previous[Y] - touch.current[Y]
		
		if (deltaTime > 200) {
			// If the finger was still at the end, then stop scrolling
			velocity[Y] = 0
			
		} else if (Math.abs(deltaPos) < 3) {
			// If the last movement was very small, then stop scrolling
			velocity[Y] = 0
			
		} else {
			velocity[Y] = deltaPos / deltaTime
		}
	}

	function _startRequestingAnimationFrames() {
		if (_tickUpdateTranslation.lastTimestamp) { return }
		requestAnimationFrame(_tickUpdateTranslation)
	}
	
	function _tickUpdateTranslation(timestamp) {
		// TODO Keep static memory references to all arrays used in here
		if (!scrollView) { return }

		var dt = (timestamp - (_tickUpdateTranslation.lastTimestamp || timestamp))
		_tickUpdateTranslation.lastTimestamp = timestamp
		// if (dt >= 20) { log("SLOW FRAME") }
		
		var excess = _boundsExcess(contentOffset)
		
		if (touch.isTouching) {
			var positionByDrag = [
				touch.contentOffsetAtStart[X] + touch.offset[X],
				touch.contentOffsetAtStart[Y] + touch.offset[Y]
			]
			var excess = _boundsExcess(positionByDrag)
			naturalOffset[X] = positionByDrag[X] - excess[X]
			naturalOffset[Y] = positionByDrag[Y] - excess[Y]	
			
			if (_isOutOfBounds(excess)) {
				// While dragging out of bounds, the excess drag has a halved effect on contentOffset
				_updateTranslation(
					naturalOffset[X] + excess[X] / OUT_OF_BOUNDS_DRAG_DIVIDER,
					naturalOffset[Y] + excess[Y] / OUT_OF_BOUNDS_DRAG_DIVIDER
				)
			} else {
				_updateTranslation(positionByDrag[X], positionByDrag[Y])
			}
			
		} else if (_isFloating() || _isOutOfBounds(excess)) {
			var distance = tags.pos.abs(excess)
			var deceleration = clip(60 / dt, 0, 1) * DECELERATION_RATE
			
			if (excess[Y]) {
				if (excess[Y] * velocity[Y] <= 0) {
					// Outside bounds, moving back in
					if (distance[Y] < 0.5 && velocity[Y] < 0.01) {
						// Close the remaining little gap at once
						contentOffset[Y] -= excess[Y]
						velocity[Y] = 0
					} else {
						velocity[Y] = -excess[Y] * BOUNCE_BACK_VELOCITY_BY_DISTANCE
					}
				} else {
					// Outside bounds, still moving out
					velocity[Y] -= excess[Y] * OUT_OF_BOUNDS_SLOWDOWN_RATE / dt
				}
			}
			
			velocity[X] *= deceleration
			velocity[Y] *= deceleration
			
			var positionByVelocity = [
				contentOffset[X] + velocity[X] * dt,
				contentOffset[Y] + velocity[Y] * dt,
			]
			
			_updateTranslation(positionByVelocity[X], positionByVelocity[Y])

			var excess = _boundsExcess(positionByVelocity)
			naturalOffset[X] = positionByVelocity[X] - excess[X]
			naturalOffset[Y] = positionByVelocity[Y] - excess[Y]
		}
		
		// Cut off early, the last fraction of velocity doesn't have much impact on movement
		var contentOffsetExcess = _boundsExcess(contentOffset)
		if (velocity[Y] && Math.abs(velocity[Y]) < VELOCITY_CUTOFF && !_isOutOfBounds(contentOffsetExcess)) {
			velocity[Y] = 0
		}
		
		if (touch.isTouching || _isFloating() || _isOutOfBounds(contentOffsetExcess)) {
			// keep animating as long as user is actively touching or the view has a velocity or the view is bouncing
			requestAnimationFrame(_tickUpdateTranslation)
		} else {
			_tickUpdateTranslation.lastTimestamp = null
		}
	}
	
	function _isFloating() {
		return !isZero(velocity)
	}
	
	function _isOutOfBounds(excess) {
		return !isZero(excess)
	}

	function _boundsExcess(position) {
		return [
			_displacementFromRange(position[X], bounds[X]),
			_displacementFromRange(position[Y], bounds[Y]),
		]
	}
	
	function _displacementFromRange(value, range) {
		if (value < range[A]) { return value - range[A] }
		else if (value > range[B]) { return value - range[B] }
		else { return 0 }
	}
	
	function _updateTranslation(x,y) {
		contentOffset[X] = x
		contentOffset[Y] = y
		
		var scrollChange = [
			visualScroll[X] - contentOffset[X],
			visualScroll[Y] - contentOffset[Y]
		]
		if (Math.abs(scrollChange[X]) >= smallestVisibleChange || Math.abs(scrollChange[Y]) >= smallestVisibleChange) {
			visualScroll[X] = contentOffset[X]
			visualScroll[Y] = contentOffset[Y]
			opts.onScroll(scrollView)
			scrollView.content.el.style.webkitTransform = 'translate3d('+(-visualScroll[X])+'px,'+(-visualScroll[Y])+'px,0)'
		}
	}
	
	function _makeTouch(pos, active) {
		return {
			lastMove: 0, offset: [0,0], direction: [0,0], isTouching: active,
			start: pos, previous: pos, current: pos, startDirection: pos,
			contentOffsetAtStart: [contentOffset[X], contentOffset[Y]]
		}
	}

}