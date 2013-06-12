var tags = require('./tags')
var style = tags.style
var viewport = require('./viewport')

var div = tags('div')

var tooltip = module.exports = {
	show:showTooltip,
	hide:hideTooltip,
	minMargin:0,
	onShowing:function(){}
}

function showTooltip(opts, contentFn) {
	tooltip.onShowing()
	if (!contentFn) { contentFn = opts; opts = {} }
	opts = tags.options(opts, {
		width:null, height:null, content:'Hello World', el:null, background:null,
		offset:[0,0],
		fade:200
	})
	var $el = $(opts.el)
	var offsetX = (opts.width - $el.width()) / 2
	var elPos = tags.addPos(tags.subPos(tags.subPos(tags.screenPos($el), viewport.pos()), [offsetX, opts.height]), opts.offset)
	
	removeTooltip()

	$(viewport.el).append(div(
		attr({ id:'tags-tooltip' }),
		style({ position:'absolute', display:'table', zIndex:3, opacity:0 }),
		div('tags-tooltip-content', contentFn, style({
			display:'table-cell', width:opts.width, height:opts.height, verticalAlign:'middle'
		}))
	))
	nextTick(function() {
		position()
		$('#tags-tooltip').css(transition('opacity', opts.fade)).css({ opacity:1 })
	})
	
	function position() {
		var leftPos = Math.min(elPos[0], viewport.width() - $('#tags-tooltip .tags-tooltip-content').width() - tooltip.minMargin)
		var topPos = Math.min(elPos[1], viewport.height() - $('#tags-tooltip .tags-tooltip-content').height() - tooltip.minMargin)
		$('#tags-tooltip').css({ left:leftPos, top:topPos })
	}
}

var removeTimeout
function hideTooltip(opts) {
	opts = tags.options(opts, { fade:100 })
	$('#tags-tooltip').css(transition('opacity', opts.fade)).css({ opacity:0 })
	removeTimeout = setTimeout(removeTooltip, opts.fade)
}

function removeTooltip() {
	clearTimeout(removeTimeout)
	$('#tags-tooltip').remove()
}