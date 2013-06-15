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
		updateView:null,
		// events
		onScroll:null,
		onPop:null
	})
	
	var size = opts.size
	var uid = tags.uid()
	var currentView
	var keptViews = {}
	var slidingPos = { x:0, y:0 }
	var slider
	var offscreen = { x:-99999, y:-99999 }
	
	nextTick(function() {
		slider = tags.byId(uid, '.tags-slider')
		if (opts.view) { setView(opts.view) }
	})
	
	return setProps(_render(), {
		setView:setView,
		getScrollingElement:getScrollingElement,
		getFoot:getFoot,
		push:push
	})
	
	function push(view) {
		gScroller.setView(view, { animate:'left', keepCurrentView:true })
	}
	
	function setView(view, viewOpts) {
		if (setView.setting) { return }
		setView.setting = true
	
		viewOpts = options(viewOpts, {
			animate:'none',
			keepCurrentView:false
		})
		
		var posDelta = posDeltas[viewOpts.animate || 'none']
		slidingPos.x -= posDelta.dx * size.width
		slidingPos.y -= posDelta.dy * size.height

		var oldView = currentView
		
		_setCurrentView(view, viewOpts)
		
		if (oldView) {
			after(opts.duration * 1.2, function() {
				_removeOldView(oldView, viewOpts)
			})
		}
		
		setView.setting = false
	}
	
	function getScrollingElement() {
		return currentView.tag.select('.tags-viewBody').el
	}
	
	function getFoot() {
		return currentView.tag.select('.tags-viewFoot')
	}
	
	/* Internals
	************/
	function _render() {
		return div(attr({ id:uid }),
			div('tags-clip', style(size, absolute, { overflow:'hidden' }),
				div('tags-slider', style(absolute, translate(0,0)))
			)
		)
	}
	
	function _setCurrentView(view, viewOpts) {
		var viewId = opts.getViewId(view)
		var keptView = keptViews[viewId]
		if (keptView) {
			currentView = keptView
			keptView.tag.css(translate(slidingPos))
			keptView.tag.select('.tags-viewBody').css(tags.style.scrollable.y)
			opts.updateView(keptView.view)
		} else {
			currentView = { tag:_renderView(view, viewOpts), view:view }
			slider.append(currentView.tag)
		}
		slider.css(translate(-slidingPos.x, -slidingPos.y, opts.duration))
		
		nextTick(function() {
			var scroller = getScrollingElement()
			$(scroller).on('scroll', function() {
				tags.__lastScroll__ = new Date().getTime()
				opts.onScroll && opts.onScroll.call(scroller)
			})
		})
	}
	
	function _renderView(view, viewOpts) {
		var alwaysBounce = (viewOpts.alwaysBounce === null ? opts.alwaysBounce : viewOpts.alwaysBounce)
		var bounceStyles = (alwaysBounce ? style({ minHeight:size.height+1 }) : null)
		return tags.wrap(document.createElement('div'))
			.attr({ class:'tags-view' })
			.css(absolute(0,0)).css(translate(slidingPos))
			.append(div(
				_makeViewPopper(viewOpts),
				div('tags-viewBody', style(absolute(0,0), size, style.scrollable.y),
					div('tags-viewBouncer', bounceStyles,
						opts.renderBody(view, viewOpts)
					)
				),
				opts.renderHead && div('tags-viewHead', style(absolute.top(0), { width:size.width }),
					opts.renderHead(view, viewOpts)
				),
				opts.renderFoot && div('tags-viewFoot', style(absolute.bottom(-size.height), { width:size.width }),
					opts.renderFoot(view, viewOpts)
				)
			))
	}
	
	function _makeViewPopper(viewOpts) {
		if (!viewOpts.keepCurrentView || viewOpts.animate != 'left') { return }
		return div(style(absolute(0,0), { zIndex:9, width:6, height:size.height }), draggable({
			move:function(pos) {
				var dx = clip(pos.distance.x, 0)
				slider.css(translate(-slidingPos.x + dx, -slidingPos.y, 0))
			},
			end:function(pos, history) {
				if (pos.change.x > 0) {
					opts.onPop()
				} else {
					slider.css(translate(-slidingPos.x, -slidingPos.y, 250))
				}
			}
		}))
	}
	
	function _removeOldView(oldView, viewOpts) {
		var oldViewId = opts.getViewId(oldView.view)
		if (viewOpts.keepCurrentView) {
			keptViews[oldViewId] = oldView
			oldView.tag.select('.tags-viewBody').css(tags.style.scrollable.none)
		} else {
			oldView.tag.destroy().remove()
		}
	}
}

var posDeltas = {
	'left': { dx:-1, dy:0 },
	'right': { dx:1, dy:0 },
	'up': { dx:0, dy:-1 },
	'down': { dx:0, dy:1 },
	'none': { dx:0, dy:0 }
}
