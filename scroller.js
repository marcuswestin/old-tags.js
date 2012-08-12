tags.scroller = function(opts) {
	opts = tags.options(opts, {
		duration:500
	})
	return $.extend(tags.create(scrollerBase), { stack:[], onViewChange:opts.onViewChange, duration:opts.duration })
}

var scrollerBase = {
	renderHead:function(headHeight, renderHeadContent) {
		this.renderHeadContent = renderHeadContent
		this.headHeight = headHeight
		return this.$head=$(div('scroller-head', style({ height:headHeight, width:'100%', position:'relative', top:0, zIndex:2 })))
	},
	renderBody:function(numViews, renderBodyContent) {
		this.renderBodyContent = renderBodyContent
		var viewportSize = tags.viewport.size()
		var contentSize = style({ height:viewport.height()-this.headHeight, width:viewport.width() })
		var crop = style({ overflowX:'hidden' })
		var scrollable = style({ 'overflow-y':'scroll', '-webkit-overflow-scrolling':'touch' })
		var floating = style({ 'float':'left' })
		var slider = style({
			height:viewport.height() - this.headHeight,
			width:viewport.width() * numViews,
			position:'relative'
		})
		
		this.body=div('scroller-body', style({ position:'absolute', top:this.headHeight, overflowX:'hidden' }),
			div('scroller-overflow', contentSize, crop,
				this._slider=div('scroller-slider', slider,
					this.views=map(new Array(numViews), function() {
						return $(div('scroller-view', contentSize, crop, floating, scrollable))
					})
				)
			)
		)
		this.push({})
		return this.body
	},
	push:function(newView, opts) {
		opts = tags.options(opts, {
			animate:true
		})
		var views = this.views
		var stack = this.stack
		var viewBelow = views[stack.length - 1]
		this.stack.push(newView)
		if (this.onViewChange) { this.onViewChange() }
		this.renderHeadContent(this.$head.empty(), newView, viewBelow)
		this.renderBodyContent(views[this.stack.length - 1].empty(), newView, viewBelow)
		this._scroll(opts.animate)
	},
	pop:function(opts) {
		opts = tags.options(opts, {
			animate:true
		})
		var stack = this.stack
		var fromView = stack.pop()
		var currentView = stack[stack.length - 1]
		var viewBelow = stack[stack.length - 2]
		if (this.onViewChange) { this.onViewChange() }
		this.renderHeadContent(this.$head.empty(), currentView, viewBelow, fromView)
		this._scroll(opts.animate)
	},
	current:function() {
		return this.stack[this.stack.length - 1]
	},
	_scroll:function(animate) {
		var offset = this.stack.length - 1
		var transition = animate ? '-webkit-transform '+this.duration/1000+'s' : 'none'
		$(this._slider).css({
			'-webkit-transition': transition,
			'-webkit-transform':'translateX('+(-offset * viewport.width())+'px)'
		})
	}
}
