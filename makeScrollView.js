var requestAnimationFrame = require('std/requestAnimationFrame')

module.exports = makeScrollView

function makeScrollView(opts) {
	opts = options(opts, {
		size:viewport.size(),
		contentSize:null,
		render:null,
		onScroll:null,
		useNativeScroll: (!tags.isTouch),
		useTranslation: true
	})
	
	var uid = tags.uid()
	var touch = _makeTouch({ x:0, y:0 }, false)
	var nativeScrollOffset = { x:0, y:0 }
	var translationOffset = { x:0, y:0 }
	var totalContentOffset = { x:0, y:0 }
	var velocity = { x:0, y:0 }

	var overflowStyle = (opts.useNativeScroll
		? (tags.isTouch ? { '-webkit-overflow-scrolling':'touch' } : { overflow:'auto' })
		: { overflow:'hidden' }
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
		contentOffset: totalContentOffset,
		velocity: velocity,
		select: _select
	})
	
	function _select() {
		var args = [uid].concat(slice(arguments))
		return tags.byId.apply(this, args)
	}
	
	function _init() {
		scrollView.content = tags.byId(uid, '.tags-content')
		
		if (opts.useNativeScroll) { _setupNativeScroll() }
		if (opts.useTranslation) { _setupTranslationScroll() }
		
		_onScroll()
	}
	
	function _onScroll() {
		totalContentOffset.x = translationOffset.x + nativeScrollOffset.x
		totalContentOffset.y = translationOffset.y + nativeScrollOffset.y
		opts.onScroll(scrollView)
	}
	
	function _setupNativeScroll() {
		tags.byId(uid).on('scroll', function(e) {
			nativeScrollOffset.x = this.scrollLeft
			nativeScrollOffset.y = this.scrollTop
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
		delete scrollView
		
		tags.byId(uid)
			.off(tags.events.start, _onTouchStart)
			.off(tags.events.move, _onTouchMove)
			.off(tags.events.cancel, _onTouchCancel)
			.off(tags.events.end, _onTouchEnd)
	}
	
	function _onTouchStart(e) {
		if (tags.events.numPointers(e) > 1) { return }
		touch = _makeTouch(tags.events.clientPosition(e), true)
		
		if (velocity.y) {
			touch.isAccellerating = true
			touch.accellerateTimeout = after(20, function() {
				touch.isAccellerating = false
				velocity.y = 0
			})
		}
		
		requestAnimationFrame(_tickUpdateTranslation)
	}
	
	function _makeTouch(pos, active) {
		return {
			lastMove: 0,
			isActive: active,
			start: pos,
			previous: pos,
			current: pos,
			isAccellerating:false,
			offset: { x:0, y:0 },
			direction: { x:0, y:0 },
			startDirection: pos,
			incorporatedOffset: { x:0, y:0 }
		}
	}
	
	function _onTouchMove(e) {
		if (!touch.isActive) { return }
		var nextPrevious = touch.current
		var pos = tags.events.clientPosition(e)
		
		touch.current = pos
		touch.lastMove = Date.now()
		
		var accellerateSameDirection = (
			(touch.current.y > touch.previous.y && velocity.y < 0)
			|| (touch.current.y < touch.previous.y && velocity.y > 0)
		)
		
		var moveNewDirection = (touch.direction.y > 0
			? touch.current.y < touch.previous.y
			: touch.current.y > touch.previous.y
		)
		if (moveNewDirection) {
			touch.direction.y = (touch.current.y > touch.previous.y ? 1 : -1)
			touch.startDirection = { y:pos.y }
		}
		
		if (touch.isAccellerating && accellerateSameDirection) {
			clearTimeout(touch.accellerateTimeout)
			velocity.y += (touch.previous.y - touch.current.y) / 10
		} else {
			velocity.y = 0
			touch.isAccellerating = false
			touch.offset.y = Math.round(touch.start.y - touch.current.y)
		}
		
		touch.previous = nextPrevious
	}
	
	function _onTouchCancel(e) {
		touch.isActive = false
	}
	
	function _onTouchEnd(e) {
		if (!touch.isAccellerating) {
			velocity.y = (touch.startDirection.y - touch.current.y) / 10
		}
		
		// If the finger was still at the end then stop scrolling
		var dt = Date.now() - touch.lastMove
		if (dt > 200 || Math.abs(touch.previous.y - touch.current.y) < 5) {
			velocity.y = 0
		}
		
		touch.isActive = false
	}
	
	function _tickUpdateTranslation() {
		if (!scrollView) { return }
		
		var touchOffsetDelta = (touch.offset.y - touch.incorporatedOffset.y)
		if (velocity.y || touchOffsetDelta) {
			translationOffset.x += 0
			translationOffset.y += (velocity.y + touchOffsetDelta)
			touch.incorporatedOffset.y = touch.offset.y
			_onScroll()

			scrollView.content.el.style.webkitTransform = ('translate3d('
				+ Math.round(-translationOffset.x)+'px,'
				+ Math.round(-translationOffset.y)+'px,0)'
			)
		}
		
		if (!touch.isActive || touch.isAccellerating) {
			velocity.y *= 0.97
		} 
		
		// Cut off early, the last fraction of velocity doesn't have much impact on movement
		if (Math.abs(velocity.y) < 0.2) {
			velocity.y = 0
		}
		
		if (velocity.y || touch.isActive) {
			requestAnimationFrame(_tickUpdateTranslation)
		}
	}
}