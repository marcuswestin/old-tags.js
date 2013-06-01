var tags = require('./tags')
var viewport = require('./viewport')
var style = require('./style')

module.exports = scroller

var translate = style.translate
function hideNavBar() { window.scrollTo(0, 1) }

if (tags.isIOSSafari) { setTimeout(hideNavBar, 10) }

scroller.onViewChanging = null
function scroller(opts) {
	return $.extend(tags.create(scrollerBase), tags.options(opts, {
		duration:350,
		onViewChanging:scroller.onViewChanging,
		onViewScrolled:null,
		alwaysBounce:true,
		renderHead:function(){},
		renderBody:null,
		renderFoot:function(){},
		updateView:function(){},
		stack:[{}]
	}))
}

var scrollerBase = {
	__numViews:0,
	toTag:tags.toTag(function() {
		var viewID = this.viewID = tags.id()
		viewport.onResize(function(size) {
			$('#'+viewID)
				.find('.tags-scroller-overflow').css(size)
					.find('.tags-scroller-slider').css({ height:size.height }).end()
				.end()
				.find('.tags-scroller-slider')
					.find('.tags-scroller-bodyScroller').css(size).end()
					.find('.tags-scroller-foot').css({ width:size.width })
					.find('.tags-scroller-head').css({ width:size.width })
		})
		return div('tags-scroller', this.__renderViews())
	}),
	__renderViews:function() {
		var self = this
		setTimeout(function() {
			var stackCopy = self.stack.slice()
			self.stack = []
			for (var i=0; i<stackCopy.length; i++) {
				self.push(stackCopy[i], { animate:false })
			}
		})
		
		return div('tags-scroller-view', { id:this.viewID }, style({ overflow:'hidden', position:'absolute', top:0 }),
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
		this._set(opts)
	},
	pop:function scrollerPop(opts) {
		opts = tags.options(opts, {
			render:true,
			useStaleView:true,
			animate:true
		})
		opts.index = this.stack.length - 2
		opts.view = this.stack[opts.index] // just set to view currently at the target index
		this._set(opts)
		this.updateView(this.stack[opts.index])
	},
	setCurrent:function setCurrent(newView, opts) {
		opts = tags.options(opts, {
			render:true,
			animate:false
		})
		opts.index = this.stack.length - 1
		opts.view = newView
		this._set(opts)
	},
	_set:function scrollerSet(opts) {
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
			var keepStaleView = (opts.useStaleView && this.stack[opts.index])
			if (!keepStaleView) {
				while (opts.index >= this.__numViews) {
					var size = viewport.getSize()
					var offsetX = this.__numViews * size.width
					var animation = animate ? this.duration : 'none'
					$('#'+this.viewID+' .tags-scroller-slider').append(
						div('tags-scroller-view', style({ position:'absolute' }, size, translate.x(offsetX, animation)),
							div('tags-scroller-bodyScroller', style(style.scrollable.y, size, {
								position:'absolute', top:0
							})),
							div('tags-scroller-head', style({
								position:'absolute', top:0, width:size.width
							})),
							div('tags-scroller-foot', style({
								position:'absolute', bottom:0, width:size.width
							}))
						)
					)
					this.__numViews += 1
					
					var onViewScrolled = this.onViewScrolled
					if (tags.isIOSSafari || onViewScrolled) {
						var scrollerViews = $('#'+this.viewID+' .tags-scroller-slider .tags-scroller-bodyScroller')
						var scrollerView = scrollerViews[scrollerViews.length - 1]
						$(scrollerView).on('scroll', function($e) {
							if (tags.isIOSSafari) {
								onIOSSafariViewScroll()
							}
							if (onViewScrolled) {
								onViewScrolled(opts.view, scrollerView)
							}
						})
					}
				}
				
				this._getHead(opts.index).empty().append(this._renderHeadContent(opts))
				this.getFoot(opts.index).empty().append(this._renderFootContent(opts))
				$(this.getScrollerElement(opts.index)).empty().append(this._renderBodyContent(opts))

				if (tags.isIOSSafari) {
					this.getScrollerElement(opts.index).scrollTop = 1
				}
			}
			
			this._slide(animate)

			if (this.onViewChanging) {
				this.onViewChanging()
			}
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
			return div('tags-scroller-bouncer', bounceStyle, div('tags-scroller-body', this.renderBody(opts.view, renderOpts)))
		} else {
			return div('tags-scroller-body', this.renderBody(opts.view, renderOpts))
		}
	},
	_renderFootContent:function(opts) {
		if (!this.renderFoot) { return }
		return this.renderFoot(opts.view)
	},
	_renderHeadContent:function(opts) {
		if (!this.renderHead) { return }
		return this.renderHead(opts.view, { viewBelow:this.stack[opts.index - 1] })
	},
	getViewElement:function(index) {
		if (index == null) { index = this.stack.length - 1 }
		return $('#'+this.viewID+' .tags-scroller-view')[index]
	},
	getScrollerElement:function(index) {
		if (index == null) { index = this.stack.length - 1 }
		return $('#'+this.viewID+' .tags-scroller-bodyScroller')[index]
	},
	getBody:function(index) {
		if (index == null) { index = this.stack.length - 1 }
		return $('#'+this.viewID+' .tags-scroller-body')[index]
	},
	getFoot:function(index) {
		if (index == null) { index = this.stack.length - 1 }
		return $($('#'+this.viewID+' .tags-scroller-foot')[index])
	},
	_getHead:function(index) {
		if (index == null) { index = this.stack.length - 1 }
		return $($('#'+this.viewID+' .tags-scroller-head')[index])
	},

	_slide:function(animate) {
		var offset = this.stack.length - 1
		$('#'+this.viewID+' .tags-scroller-slider').css(translate.x(-offset * viewport.width(), animate ? this.duration : 'none'))
	}
}

function hideNavBarOnLetGo() {
	$(document).on('touchend', doHide)
	function doHide() {
		$(document).off('touchend', doHide)
		hideNavBar()
	}
}

function onIOSSafariViewScroll() {
	tags.__lastScroll__ = new Date().getTime()

	if (this.scrollTop < 1) { return }
	hideNavBarOnLetGo()
}
