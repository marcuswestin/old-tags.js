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
	zIndex:10
}

function hideOverlay(opts) {
	if (typeof opts == 'function') { opts = { finish:opts } }
	opts = tags.options(opts, {
		duration:250,
		finish:function(){}
	})
	
	if (!$('#tags-overlay')[0]) {
		return opts.finish()
	}
	
	$('#tags-overlay').css(transition('opacity', opts.duration)).css({ opacity:0 })
	hidingTimeout = setTimeout(function() {
		$('#tags-overlay').remove()
		opts.finish()
	}, opts.duration)
}

function resizeOverlay(size) {
	$('#tags-overlay .tags-overlay-content, #tags-overlay .tags-overlay-shadow').css(getLayout(size))
}

var lastOpts
var hidingTimeout
function renderOverlay(opts, contentFn) {
	if (!contentFn) { contentFn = opts; opts = {} }
	
	var viewportSize = viewport.size()
	lastOpts = opts = tags.options(opts, {
		element:viewport.element,
		duration:250,
		delay:0,
		dismissable:false,
		background:'rgba(25,25,25,.5)'
	})
	
	var $el = $(opts.element)
	var offset = $el.offset() || {}
	var size = { width:$el.width(), height:$el.height() }
	if (hidingTimeout) {
		clearTimeout(hidingTimeout)
		$('#tags-overlay').css(transition('opacity', opts.duration)).css({ opacity:1 })
	}
	
	if (!$('#tags-overlay')[0]) {
		$(document.body).prepend(div(
			{ id:'tags-overlay' },
			style({ position:'fixed', opacity:0, display:'table', zIndex:overlay.zIndex })
		))
		setTimeout(function() {
			$('#tags-overlay').css(transition('opacity', opts.duration)).css({ opacity:1 })
		}, opts.delay)
	}
	
	$('#tags-overlay')
		.empty()
		.css(size).css(offset)
		.append(
			div('tags-overlay-background', style(size, absolute(0,0), { background:opts.background }), lastOpts.dismissable && button(function() { overlay.hide(opts) })),
			div('tags-overlay-content', style(absolute(0,0), { display:'table-cell', verticalAlign:'middle' }), contentFn)
		)
}

function getLayout(size) {
	return {
		width:size.width,
		height:size.height,
		left:Math.round((viewport.width() - size.width) / 2),
		top:Math.round((viewport.height() - size.height) / 2)
	}
}
