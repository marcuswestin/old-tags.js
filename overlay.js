var tags = require('./tags')
var style = tags.style
var viewport = require('./viewport')
var button = require('./button')

var div = tags('div')
var transition = style.transition

var overlay = module.exports = {
	show:renderOverlay,
	hide:hideOverlay,
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

var lastOpts
var hidingTimeout
function renderOverlay(opts, contentFn) {
	if (contentFn == null) { contentFn = opts; opts = {} }
	
	lastOpts = opts = tags.options(opts, {
		el:viewport.el,
		duration:250,
		delay:0,
		dismissable:false,
		background:'rgba(25,25,25,.7)'
	})
	
	var $el = $(opts.el)
	var offset = $el.offset() || {}
	var size = { width:$el.width(), height:$el.height() }
	if (hidingTimeout) {
		clearTimeout(hidingTimeout)
		$('#tags-overlay').css(transition('opacity', opts.duration)).css({ opacity:1 })
	}
	
	if (!$('#tags-overlay')[0]) {
		$(document.body).prepend(div(
			attr({ id:'tags-overlay' }),
			style({ position:'fixed', opacity:0, zIndex:overlay.zIndex })
		))
		setTimeout(function() {
			$('#tags-overlay').css(transition('opacity', opts.duration)).css({ opacity:1 })
		}, opts.delay)
	}
	
	$('#tags-overlay')
		.empty()
		.css(size).css(offset)
		.append(
			div('tags-overlay-background', style(size, absolute(0,0), { background:opts.background })),
			div('tags-overlay-content', style(size, absolute(0,0), { display:'table' }),
				div(style({ display:'table-cell', verticalAlign:'middle' }),
					lastOpts.dismissable && button(function() { overlay.hide(opts) }),
					contentFn
				)
			)
		)
}
