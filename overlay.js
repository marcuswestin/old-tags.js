var tags = require('./tags')
var style = require('./style')
var viewport = require('./viewport')
var button = require('./button')

var div = tags('div')
var transition = style.transition

var overlay = module.exports = renderOverlay
overlay.show = renderOverlay
overlay.hide = hideOverlay
overlay.resize = resizeOverlay
overlay.zIndex = 10
overlay.defaultElement = null

function hideOverlay(opts) {
	if (typeof opts == 'function') { opts = { finish:opts } }
	opts = tags.options(opts, {
		duration:250,
		finish:function(){}
	})
	$('.tags-overlay').css(transition('opacity', opts.duration)).css({ opacity:0 })
	setTimeout(function() {
		$('.tags-overlay').remove()
		opts.finish()
	}, opts.duration)
}

function resizeOverlay(size) {
	$('.tags-overlay .tags-overlay-content').css(getLayout(size))
}

function renderOverlay(opts) {
	if (typeof opts == 'function') { opts = { content:opts } }
	
	var viewportSize = viewport.size()
	opts = tags.options(opts, {
		element:overlay.defaultElement,
		width:null,
		height:null,
		duration:250,
		delay:0,
		dismissable:true,
		content:null,
		translate:null,
		background:'rgba(25,25,25,.45)'
	})
	
	var offset = $(opts.element).offset()
	var sizer = $(opts.element)
	var size = { width:opts.width || sizer.width(), height:opts.height || sizer.height() }
	var translation = opts.translate ? style.translate(opts.translate[0], opts.translate[1]) : null
	$(document.body).append(div('tags-overlay', style({ position:'fixed', top:offset.top, left:offset.left, opacity:0, zIndex:overlay.zIndex }),
		div('tags-overlay-background', style(viewportSize, { position:'absolute', background:opts.background }), opts.dismissable && button(function() {
			overlay.hide(opts)
		})),
		div('tags-overlay-content', opts.content, style({ position:'absolute' }, getLayout(size), translation))
	))
	
	setTimeout(function() {
		console.log("HERE", $('.tags-overlay')[0])
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
