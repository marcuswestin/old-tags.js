var tags = require('./tags')
var viewport = require('./viewport')
var div = tags('div')

module.exports = scroller

function scroller(opts) {
	opts = tags.options(opts, {
		duration:350,
		onViewChange:null,
		alwaysBounce:true
	})
	return $.extend(tags.create(scrollerBase), {
		onViewChange:opts.onViewChange,
		duration:opts.duration,
		alwaysBounce:opts.alwaysBounce,
		stack:[]
	})
}

var scrollerBase = {
	headHeight:0,
	renderHead:function(headHeight, renderHeadContent) {
		this.renderHeadContent = renderHeadContent
		this.headHeight = headHeight
		return this.$head=$(div('tags-scroller-head', style({ height:headHeight, width:'100%', position:'relative', top:0, zIndex:2 })))
	},
	renderBody:function(numViews, renderBodyContent) {
		this.renderBodyContent = renderBodyContent
		var viewportSize = viewport.size()
		var contentSize = style({ height:viewport.height()-this.headHeight, width:viewport.width() })
		var crop = style({ overflowX:'hidden' })
		var scrollable = style({ 'overflow-y':'scroll', '-webkit-overflow-scrolling':'touch' })
		var floating = style({ 'float':'left' })
		var slider = style({
			height:viewport.height() - this.headHeight,
			width:viewport.width() * numViews,
			position:'relative'
		})
		
		this.body=div('tags-scroller-body', style({ position:'absolute', top:this.headHeight, overflowX:'hidden' }),
			div('tags-scroller-overflow', contentSize, crop,
				this.$slider=$(div('tags-scroller-slider', slider,
					this.views=map(new Array(numViews), function() {
						return $(div('tags-scroller-view', contentSize, crop, floating, scrollable))
					})
				))
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
			render:true,
			useStaleView:false,
			alwaysBounce:null,
			animate:null,
			index:null, // required
			view:null   // required
		})
		
		var isNewTopView = opts.index == this.stack.length
		var animate = (opts.animate === null ? isNewTopView : opts.animate)
		
		this.stack.length = opts.index + 1
		this.stack[opts.index] = opts.view
		
		if (opts.render) {
			if (this.onViewChange) {
				this.onViewChange()
			}
			if (this.$head) {
				this.$head.empty().append(
					this.renderHeadContent(opts.view, { viewBelow:this.views[opts.index - 1] })
				)
			}
			var keepStaleView = (opts.useStaleView && this.views[opts.index])
			if (!keepStaleView) {
				this.views[opts.index].empty().append(this._renderBodyContent(opts))
			}
			this._scroll(animate)
		}
	},
	_renderBodyContent:function(opts) {
		var renderOpts = { index:opts.index }
		var alwaysBounce = (opts.alwaysBounce === null ? this.alwaysBounce : opts.alwaysBounce)
		if (alwaysBounce) {
			var bounceStyle = style({ // the bouncer makes the content view always bounce-scrollable
				height:viewport.height()-this.headHeight - 7,
				width:viewport.width()
			})
			return div('tags-scroller-bouncer', bounceStyle, this.renderBodyContent(opts.view, renderOpts))
		} else {
			return this.renderBodyContent(opts.view, renderOpts)
		}
	},
	current:function() {
		return this.stack[this.stack.length - 1]
	},
	_scroll:function(animate) {
		var offset = this.stack.length - 1
		this.$slider.css(
			style.translate.x(-offset * viewport.width(), animate ? this.duration : 'none')
		)
	}
}
