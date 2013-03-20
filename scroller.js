var tags = require('./tags')
var viewport = require('./viewport')
var style = require('./style')

module.exports = scroller

var translate = style.translate
function hideNavBar() { window.scrollTo(0, 1) }

if (tags.isMobileSafari) { setTimeout(hideNavBar, 10) }

scroller.onViewChanging = null
function scroller(opts) {
	return $.extend(tags.create(scrollerBase), tags.options(opts, {
		duration:350,
		onViewChanging:scroller.onViewChanging,
		alwaysBounce:true,
		renderHead:function(){},
		renderBody:null,
		renderFoot:function(){},
		stack:[{}]
	}))
}

var scrollerBase = {
	__numViews:0,
	__renderTag:function() {
		var bodyID = this.bodyID = tags.id()
		this.headID = tags.id()
		viewport.onResize(function(size) {
			$('#'+bodyID)
				.find('.tags-scroller-overflow').css(size)
					.find('.tags-scroller-slider').css({ height:size.height }).end()
				.end()
				.find('.tags-scroller-slider')
					.find('.tags-scroller-view').css(size).end()
					.find('.tags-scroller-foot').css({ width:size.width })
		})
		return div('tags-scroller',
			this.__renderHead(),
			this.__renderViews()
		)
	},
	__renderHead:function() {
		return div('tags-scroller-head', { id:this.headID }, style({
			height:0, width:'100%', position:'absolute', top:0, zIndex:2
		}))
	},
	__renderViews:function() {
		var self = this
		setTimeout(function() {
			var stackCopy = self.stack.slice()
			self.stack = []
			for (var i=0; i<stackCopy.length; i++) {
				self.push(stackCopy[i], { animate:false })
			}
		})
		
		return div('tags-scroller-body', { id:this.bodyID }, style({ overflow:'hidden', position:'absolute', top:0 }),
			div('tags-scroller-overflow', style(viewport.getSize(), { overflow:'hidden' }),
				div('tags-scroller-slider', style({ height:viewport.height() }))
			)
		)
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
			this._update(opts, $('#'+this.headID), this.renderHead)
			this._update(opts, $('#'+this.footID), this.renderFoot)

			var keepStaleView = (opts.useStaleView && this.getView(opts.index))
			if (!keepStaleView) {
				while (opts.index >= this.__numViews) {
					var size = viewport.getSize()
					var offsetX = this.__numViews * size.width
					$('#'+this.bodyID+' .tags-scroller-slider')
						.append(div('tags-scroller-view', style(translate.x(offsetX), style.scrollable.y, size, {
							position:'absolute', top:0
						})))
						.append(div('tags-scroller-foot', style(translate.x(offsetX), {
							position:'absolute', bottom:0, width:size.width
						})))
					this.__numViews += 1
					
					if (tags.isMobileSafari) {
						var scrollerViews = $('#'+this.bodyID+' .tags-scroller-slider .tags-scroller-view')
						$(scrollerViews[scrollerViews.length - 1]).on('scroll', onViewScroll)
					}
				}
				
				this.getView(opts.index).empty().append(this._renderBodyContent(opts))
				this.getFoot(opts.index).empty().append(this._renderFootContent(opts))
				
				if (tags.isMobileSafari) {
					this.getView(opts.index)[0].scrollTop = 1
				}
			}
			
			this._scroll(animate)
		}
	},
	_update:function(opts, element, updateFn) {
		if (!updateFn) { return }
		var fnResult = updateFn.call(element, opts.view, { viewBelow:this.stack[opts.index - 1] })
		if (fnResult != null) {
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
				minHeight:viewport.height() + 1,
				width:viewport.width()
			})
			return div('tags-scroller-bouncer', bounceStyle, this.renderBody(opts.view, renderOpts))
		} else {
			return this.renderBody(opts.view, renderOpts)
		}
	},
	_renderFootContent:function(opts) {
		if (!this.renderFoot) { return }
		return this.renderFoot(opts.view)
	},
	current:function() {
		return this.stack[this.stack.length - 1]
	},
	getCurrentView:function() { return this.getView() },
	getView:function(index) {
		if (index == null) { index = this.stack.length - 1 }
		return $($('#'+this.bodyID+' .tags-scroller-view')[index])
	},
	getFoot:function(index) {
		if (index == null) { index = this.stack.length - 1 }
		return $($('#'+this.bodyID+' .tags-scroller-foot')[index])
	},
	_scroll:function(animate) {
		var offset = this.stack.length - 1
		$('#'+this.bodyID+' .tags-scroller-slider').css(translate.x(-offset * viewport.width(), animate ? this.duration : 'none'))
	}
}

function hideNavBarOnLetGo() {
	$(document).on('touchend', doHide)
	function doHide() {
		$(document).off('touchend', doHide)
		hideNavBar()
	}
}

function onViewScroll() {
	tags.__lastScroll__ = new Date().getTime()

	if (this.scrollTop < 1) { return }
	hideNavBarOnLetGo()
}
