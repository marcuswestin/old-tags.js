var tags = require('./tags')
var style = require('./style')
var viewport = require('./viewport')
var button = require('./button')

var div = tags('div')
var transition = style.transition

var overlay = module.exports = {
	show:renderOverlay,
	hide:hideOverlay,
	resize:resizeOverlay,
	zIndex:10,
	defaultElement:null
}

function hideOverlay(opts) {
	if (typeof opts == 'function') { opts = { finish:opts } }
	opts = tags.options(opts, {
		duration:250,
		finish:function(){}
	})
	
	if (!$('.tags-overlay')[0]) {
		return opts.finish()
	}
	
	$('.tags-overlay').css(transition('opacity', opts.duration)).css({ opacity:0 })
	setTimeout(function() {
		$('.tags-overlay').remove()
		opts.finish()
	}, opts.duration)
}

function resizeOverlay(size) {
	$('.tags-overlay .tags-overlay-content').css(getLayout(size))
}

function renderOverlay(opts, contentFn) {
	if (!contentFn) { contentFn = opts; opts = {} }
	
	var viewportSize = viewport.size()
	opts = tags.options(opts, {
		element:overlay.defaultElement,
		duration:250,
		delay:0,
		dismissable:false,
		background:'rgba(25,25,25,.5)'
	})
	
	var $el = $(opts.element)
	var offset = $el.offset()
	var size = { width:$el.width(), height:$el.height() }
	$('.tags-overlay').remove()
	$(document.body).append(div('tags-overlay',
		style(size, offset, { position:'fixed', opacity:0, zIndex:overlay.zIndex, background:opts.background, display:'table' }),
		opts.dismissable && button(function() { overlay.hide(opts) }),
		div('tags-overlay-content', style({ display:'table-cell', verticalAlign:'middle' }), contentFn)
	))
	
	setTimeout(function() {
		$('.tags-overlay').css(transition('opacity', opts.duration)).css({ opacity:1 })
	}, opts.delay)
}

function getLayout(size) {
	return {
		width:size.width,
		height:size.height,
		left:Math.round((viewport.width() - size.width) / 2),
		top:Math.round((viewport.height() - size.height) / 2)
	}
}
