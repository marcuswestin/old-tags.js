var tags = require('./tags')
var viewport = require('./viewport')
var style = require('./style')

module.exports = scroller

function scroller(opts) {
	opts = tags.options(opts, {
		duration:350,
		onViewChanging:null,
		alwaysBounce:true
	})
	return $.extend(tags.create(scrollerBase), {
		onViewChanging:opts.onViewChanging,
		duration:opts.duration,
		alwaysBounce:opts.alwaysBounce,
		stack:[]
	})
}

var scrollerBase = {
	headHeight:0,
	renderHead:function(headHeight, headFn) {
		this.headHeight = headHeight
		this.headFn = headFn
		this.headID = tags.id()
		return div('tags-scroller-head', { id:this.headID }, style({
			height:headHeight, width:'100%', position:'relative', top:0, zIndex:2
		}))
	},
	renderBody:function(numViews, renderBodyContent) {
		this.renderBodyContent = renderBodyContent
		var viewportSize = viewport.size()
		var contentSize = style({ height:viewport.height()-this.headHeight, width:viewport.width() })
		var crop = style({ overflowX:'hidden' })
		var scrollable = style({ overflowY:'scroll', '-webkit-overflow-scrolling':'touch' })
		var floating = style({ 'float':'left' })
		var slider = style({
			height:viewport.height() - this.headHeight,
			width:viewport.width() * numViews
		})
		
		this.bodyID = tags.id()
		var self = this
		setTimeout(function() {
			$('#'+self.bodyID+' .tags-scroller-view').on('scroll', function() {
				tags.__lastScroll__ = new Date().getTime()
			})
			self.push({})
		})
		
		return div('tags-scroller-body', { id:this.bodyID }, style({ position:'absolute', top:this.headHeight, overflowX:'hidden' }),
			div('tags-scroller-overflow', contentSize, crop,
				div('tags-scroller-slider', slider,
					map(new Array(numViews), function() {
						return div('tags-scroller-view', contentSize, crop, floating, scrollable)
					})
				)
			)
		)
	},
	renderFoot:function(footFn) {
		this.footFn = footFn
		this.footID = tags.id()
		return div('tags-scroller-foot', { id:this.footID }, style({
			width:'100%', position:'absolute', bottom:0, zIndex:2
		}))
	},
	push:function scollerPush(newView, opts) {
		opts = tags.options(opts, {
			render:true,
			animate:true
		})
		opts.index = this.stack.length
		opts.view = newView
		this.set(opts)
	},
	pop:function scrollerPop(opts) {
		opts = tags.options(opts, {
			render:true,
			useStaleView:true,
			animate:true
		})
		opts.index = this.stack.length - 2
		opts.view = this.stack[opts.index] // just set to view currently at the target index
		this.set(opts)
	},
	set:function scrollerSet(opts) {
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
			if (this.onViewChanging) {
				this.onViewChanging()
			}
			this._update(opts, $('#'+this.headID), this.headFn)
			this._update(opts, $('#'+this.footID), this.footFn)

			var keepStaleView = (opts.useStaleView && this.getView(opts.index))
			if (!keepStaleView) {
				$(this.getView(opts.index)).empty().append(this._renderBodyContent(opts))
			}
			
			this._scroll(animate)
		}
	},
	_update:function(opts, element, updateFn) {
		if (!updateFn) { return }
		var fnResult = updateFn.call(element, opts.view, { viewBelow:this.stack[opts.index - 1] })
		if (fnResult) {
			// Allow for the header and footer to return content to be displayed.
			// Alt. they can choose not re-render, but rather update what's already rendered and avoid a flash of no content.
			$(element).empty().append(fnResult)
		}
	},
	_renderBodyContent:function(opts) {
		var renderOpts = { index:opts.index }
		var alwaysBounce = (opts.alwaysBounce === null ? this.alwaysBounce : opts.alwaysBounce)
		if (alwaysBounce) {
			var bounceStyle = style({ // the bouncer makes the content view always bounce-scrollable
				height:viewport.height()-this.headHeight + 1,
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
	getCurrentView:function() {
		return $(this.getView(this.stack.length - 1))
	},
	getView:function(index) {
		return $('#'+this.bodyID+' .tags-scroller-view')[index]
	},
	_scroll:function(animate) {
		var offset = this.stack.length - 1
		$('#'+this.bodyID+' .tags-scroller-slider').css(style.translate.x(-offset * viewport.width(), animate ? this.duration : 'none'))
	}
}
