var viewport = require('tags/viewport')

module.exports = makeSingleViewController

function makeSingleViewController(opts) {
	opts = options(opts, {
		// misc
		size:viewport.size(),
		duration: 350,
		getViewId:null,
		view:null,
		// rendering
		renderHead:null,
		renderBody:null,
		renderFoot:null,
		// life cycling
		destroyView:null,
		shouldKeepView:function() { return false },
		// events
		onScroll:null
	})
	
	var size = opts.size
	var uid = tags.uid()
	var currentIndex = 0
	var currentView
	var keptViews = {}
	var slidingPos = { x:0, y:0 }
	var zIndex = 0
	
	nextTick(function() {
		if (opts.view) { setView(opts.view) }
	})
	
	return setProps(_render(), {
		setView:setView,
		getScrollingElement:getScrollingElement,
		push:push
	})
	
	function push(view) {
		gScroller.setView(view, { animate:'left' })
	}
	
	function setView(view, viewOpts) {
		viewOpts = options(viewOpts, {
			animate:'none'
		})
		
		var posDelta = posDeltas[viewOpts.animate || 'none']
		slidingPos.x += posDelta.dx * size.width
		slidingPos.y += posDelta.dy * size.height

		var oldView = currentView
		var oldIndex = currentIndex
		
		_setCurrentView(view, viewOpts)
		
		nextTick(function() {
			tags.byId(uid, '.tags-slider').css(translate(slidingPos.x, slidingPos.y, opts.duration))
			
			if (!oldView) { return }
			after(opts.duration, function() {
				_removeOldView(oldView, oldIndex)
			})
		})
	}
	
	function getScrollingElement() {
		return tags.byId(uid, '.tags-viewRecycler'+currentIndex, '.tags-viewBody').el
	}
	
	/* Internals
	************/
	function _render() {
		return div(attr({ id:uid }),
			div('tags-clip', style(size, absolute, { overflow:'hidden' }),
				div('tags-slider', style(absolute, translate(0,0)),
					div('tags-viewRecycler0', style(absolute(0,0), translate(0,0), size)),
					div('tags-viewRecycler1', style(absolute(0,0), translate(0,0), size))
				)
			)
		)
	}
	
	function _renderView(view, viewOpts) {
		var alwaysBounce = (viewOpts.alwaysBounce === null ? opts.alwaysBounce : viewOpts.alwaysBounce)
		var bounceStyles = (alwaysBounce ? style({ minHeight:size.height+1 }) : null)
		return div('tags-view',
			div('tags-viewBody', style(absolute(0,0), size, style.scrollable.y),
				div('tags-viewBouncer', bounceStyles,
					opts.renderBody(view, viewOpts)
				)
			),
			opts.renderHead && div('tags-viewHead', style(absolute.top(0), { width:size.width }),
				opts.renderHead(view, viewOpts)
			),
			opts.renderFoot && div('tags-viewFoot', style(absolute.bottom(0), { width:size.width }),
				opts.renderFoot(view, viewOpts)
			)
		)
	}
	
	function _setCurrentView(view, viewOpts) {
		currentView = view
		var viewId = opts.getViewId(view)
		tags.byId(uid, '.tags-viewRecycler'+_alternateIndex())
			.append(keptViews[viewId] || _renderView(view, viewOpts))
			.css(translate(-slidingPos.x, -slidingPos.y)).css({ zIndex:zIndex++ })
	}
	
	function _removeOldView(oldView, oldIndex) {
		var oldViewId = opts.getViewId(oldView)
		var oldViewEl = tags.byId(uid, '.tags-viewRecycler'+oldIndex).el.children[0]
		if (opts.shouldKeepView(oldView)) {
			keptViews[oldViewId] = oldViewEl
		} else {
			tags.destroy(oldViewEl)
		}
		tags.remove(oldViewEl)
	}
	
	function _alternateIndex() {
		return (currentIndex = ((currentIndex + 1) % 2))
	}
}

var posDeltas = {
	'left': { dx:-1, dy:0 },
	'right': { dx:1, dy:0 },
	'up': { dx:0, dy:-1 },
	'down': { dx:0, dy:1 },
	'none': { dx:0, dy:0 }
}
