tags.scroller = function(opts) {
	opts = tags.options(opts, {
		duration:500,
		onViewChange:null
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
		this._renderBodyContent = renderBodyContent
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
			render:true,
			animate:true
		})
		opts.index = this.stack.length
		opts.view = newView
		this.set(opts)
	},
	pop:function(opts) {
		opts = tags.options(opts, {
			render:true,
			useStaleView:true,
			animate:true
		})
		opts.index = this.stack.length - 2
		opts.view = this.stack[opts.index] // just set to view currently at the target index
		this.set(opts)
	},
	set:function(opts) {
		opts = tags.options(opts, {
			animate:false,
			render:false,
			useStaleView:false,
			index:null, // required
			view:null   // required
		})
		this.stack.length = opts.index + 1
		this.stack[opts.index] = opts.view
		
		if (opts.render) {
			var viewBelow = this.views[opts.index - 1]
			if (this.onViewChange) {
				this.onViewChange()
			}
			this.$head.empty().append(
				this.renderHeadContent(opts.view, { viewBelow:viewBelow })
			)
			var keepStaleView = (opts.useStaleView && this.views[opts.index])
			if (!keepStaleView) {
				this.views[opts.index].empty().append(
					this.renderBodyContent(opts.view)
				)
			}
			this._scroll(opts.animate)
		}
	},
	renderBodyContent:function(view, opts) {
		return div('scroller-bouncer', style({ // the bouncer makes the content view always bounce-scrollable
			height:viewport.height()-this.headHeight - 7,
			width:viewport.width()
		}), this._renderBodyContent(view, opts))
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
