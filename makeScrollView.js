var makeTouchScroller = require('./makeTouchScroller')

var tags = require('./tags')
var X = tags.constants.X
var Y = tags.constants.Y
var style = tags.style

module.exports = makeScrollView

function makeScrollView(opts) {
	opts = options(opts, {
		viewSize:viewport.size,
		contentSize:null,
		onScroll:null,
		useTouchScroller:tags.isTouch
	})
	
	var uid = tags.uid()
	var touchScroller
	var scroll = [0,0]
	var visualScroll = [0,0]
	var smallestVisibleChange = 1 / (tags.pixelRatio * 1/2) // the smallest offset change that can be visually detected	

	var overflowStyle = (opts.useTouchScroller ? tags.style.notScrollable : tags.style.scrollable)
	var scrollView = div('tags-scrollView',
		attr({ id:uid }), tags.destructible(_destroy),
		style(style.size(opts.viewSize), absolute(), translate(0,0), overflowStyle),
		div('tags-content', style(absolute(0,0), translate(0,0), size(opts.contentSize), { overflow:'hidden' }))
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
		var change = [this.scrollLeft - scroll[X], this.scrollTop - scroll[Y]]
		scroll[X] = visualScroll[X] = this.scrollLeft
		scroll[Y] = visualScroll[Y] = this.scrollTop
		opts.onScroll({ change:change })
	}
	
	/* Using touch scroller
	***********************/
	function _setupTouchScroller() {
		touchScroller = makeTouchScroller({
			viewSize: opts.viewSize,
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
			opts.onScroll({ change:scrollChange })
			scrollView.content.el.style.webkitTransform = 'translate3d('+(-visualScroll[X])+'px,'+(-visualScroll[Y])+'px,0)'
		}
	}	
}