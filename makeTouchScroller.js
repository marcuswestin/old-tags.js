var requestAnimationFrame = require('std/requestAnimationFrame')

module.exports = makeTouchScroller

var tags = require('./tags')
var X = tags.X
var Y = tags.Y
var A = tags.A
var B = tags.B
var isZero = tags.pos.isZero

function makeTouchScroller(opts) {
	opts = tags.options(opts, {
		size: null,
		contentSize: null,
		onScroll: null
	})
	
	var ACCELERATION_FRACTION = 180
	var DECELERATION_RATE = 0.975
	var BOUNCE_BACK_VELOCITY_BY_DISTANCE = 0.01
	var OUT_OF_BOUNDS_SLOWDOWN_RATE = 0.08
	var OUT_OF_BOUNDS_DRAG_DIVIDER = 2
	var VELOCITY_CUTOFF = 0.005

	var bouncingOffset = [0,0] // visual offset of scroll view content (including "bounce" at bounds)
	var boundedOffset = [0,0]  // logical offset of scroll view content (excluding visual "bounce" at bounds)
	var velocity = [0,0]       // velocity of moving content

	var touch = _makeTouch([0,0], false)
	var bounds = [
		[0, opts.contentSize.width],
		[0, opts.contentSize.height - opts.size.height]
	]
	
	var touchScroller = {
		boundedOffset: boundedOffset,
		bouncingOffset: bouncingOffset,
		startTouch: startTouch,
		moveTouch: moveTouch,
		endTouch: endTouch
	}
	
	return touchScroller
	
	function startTouch(e) {
		if (tags.events.numPointers(e) > 1) { return }
		touch = _makeTouch(tags.events.clientPosition(e), true)
		
		velocity[X] = 0
		velocity[Y] = 0
		
		_startRequestingAnimationFrames()
	}
	
	function moveTouch(e) {
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
	
	function endTouch(e) {
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
	
	// TODO Keep static memory references to all arrays used in _tickUpdateTranslation
	function _tickUpdateTranslation(timestamp) {
		var dt = (timestamp - (_tickUpdateTranslation.lastTimestamp || timestamp))
		_tickUpdateTranslation.lastTimestamp = timestamp
		// if (dt >= 20) { log("SLOW FRAME") }
		
		var excess = _boundsExcess(bouncingOffset)
		
		if (touch.isTouching) {
			var positionByDrag = [
				touch.bouncingScrollAtStart[X] + touch.offset[X],
				touch.bouncingScrollAtStart[Y] + touch.offset[Y]
			]
			var excess = _boundsExcess(positionByDrag)
			boundedOffset[X] = positionByDrag[X] - excess[X]
			boundedOffset[Y] = positionByDrag[Y] - excess[Y]	
			
			if (_isOutOfBounds(excess)) {
				// While dragging out of bounds, the excess drag has a halved effect on bouncingOffset
				_updateTranslation(
					boundedOffset[X] + excess[X] / OUT_OF_BOUNDS_DRAG_DIVIDER,
					boundedOffset[Y] + excess[Y] / OUT_OF_BOUNDS_DRAG_DIVIDER
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
						bouncingOffset[Y] -= excess[Y]
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
				bouncingOffset[X] + velocity[X] * dt,
				bouncingOffset[Y] + velocity[Y] * dt,
			]
			
			_updateTranslation(positionByVelocity[X], positionByVelocity[Y])

			var excess = _boundsExcess(positionByVelocity)
			boundedOffset[X] = positionByVelocity[X] - excess[X]
			boundedOffset[Y] = positionByVelocity[Y] - excess[Y]
		}
		
		// Cut off early, the last fraction of velocity doesn't have much impact on movement
		var bouncingScrollExcess = _boundsExcess(bouncingOffset)
		if (velocity[Y] && Math.abs(velocity[Y]) < VELOCITY_CUTOFF && !_isOutOfBounds(bouncingScrollExcess)) {
			velocity[Y] = 0
		}
		
		if (touch.isTouching || _isFloating() || _isOutOfBounds(bouncingScrollExcess)) {
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
		bouncingOffset[X] = x
		bouncingOffset[Y] = y
		opts.onScroll(touchScroller)
	}
	
	function _makeTouch(pos, active) {
		return {
			lastMove: 0, offset: [0,0], direction: [0,0], isTouching: active,
			start: pos, previous: pos, current: pos, startDirection: pos,
			bouncingScrollAtStart: [bouncingOffset[X], bouncingOffset[Y]]
		}
	}

}
