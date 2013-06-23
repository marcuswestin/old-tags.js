var makeTouchScroller = require('./makeTouchScroller')

var tags = require('./tags')
var X = tags.X
var Y = tags.Y

module.exports = makeScrollView

function makeScrollView(opts) {
	opts = options(opts, {
		size:viewport.size(),
		contentSize:null,
		onScroll:null,
		useTouchScroller: tags.isTouch
	})
	
	var uid = tags.uid()
	var touchScroller
	var scroll = [0,0]
	var visualScroll = [0,0]
	var smallestVisibleChange = 1 / (tags.pixelRatio * 2) // the smallest offset change that can be visually detected	

	var overflowStyle = (opts.useTouchScroller ? { overflow:'hidden' } : tags.style.scrollable)
	var scrollView = div('tags-scrollView',
		attr({ id:uid }), tags.destructible(_destroy),
		style(opts.size, absolute, translate(0,0), overflowStyle),
		div('tags-content', style(absolute(0,0), translate(0,0), opts.contentSize, { overflow:'hidden' }))
	)
	
	nextTick(_init)
	return setProps(scrollView, {
		scroll: scroll,
		visualScroll: visualScroll,
		content: null,
		select: select
	})
	
	function select() {
		return scrollView.content.select.apply(scrollView.content, arguments)
	}

	function _init() {
		if (opts.useTouchScroller) {
			_setupTouchScroller()
		} else {
			_setupNativeScroll()
		}
		scrollView.content = tags.byId(uid, '.tags-content')
		opts.onScroll(scrollView)
	}

	function _destroy() {
		if (opts.useTouchScroller) {
			_destroyTouchScroller()
		} else {
			_destroyNativeScroll()
		}
	}
	
	/* Using native scrolling
	*************************/
	function _setupNativeScroll() {
		tags.byId(uid).on('scroll', _onNativeScroll)
	}
	
	function _destroyNativeScroll() {
		tags.byId(uid).off('scroll', _onNativeScroll)
	}
	
	function _onNativeScroll(e) {
		scroll[X] = visualScroll[X] = this.scrollLeft
		scroll[Y] = visualScroll[Y] = this.scrollTop
		opts.onScroll(scrollView)
	}
	
	/* Using touch scroller
	***********************/
	function _setupTouchScroller() {
		touchScroller = makeTouchScroller({
			size: opts.size,
			contentSize: opts.contentSize,
			onScroll: _onTouchScroll
		})
		
		tags.byId(uid)
			.on(tags.events.start, touchScroller.startTouch)
			.on(tags.events.move, touchScroller.moveTouch)
			.on(tags.events.end, touchScroller.endTouch)
			.on(tags.events.cancel, touchScroller.endTouch)
	}
	function _destroyTouchScroller() {
		tags.byId(uid)
			.off(tags.events.start, touchScroller.startTouch)
			.off(tags.events.move, touchScroller.moveTouch)
			.off(tags.events.end, touchScroller.endTouch)
			.off(tags.events.cancel, touchScroller.endTouch)
	}
	function _onTouchScroll() {
		var scrollChange = [
			Math.abs(visualScroll[X] - touchScroller.bouncingOffset[X]),
			Math.abs(visualScroll[Y] - touchScroller.bouncingOffset[Y])
		]
		if (scrollChange[X] >= smallestVisibleChange || scrollChange[Y] >= smallestVisibleChange) {
			visualScroll[X] = touchScroller.bouncingOffset[X]
			visualScroll[Y] = touchScroller.bouncingOffset[Y]
			scroll[X] = touchScroller.boundedOffset[X]
			scroll[Y] = touchScroller.boundedOffset[Y]
			opts.onScroll(scrollView)
			scrollView.content.el.style.webkitTransform = 'translate3d('+(-visualScroll[X])+'px,'+(-visualScroll[Y])+'px,0)'
		}
	}	
}