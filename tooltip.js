var tags = require('./tags')
var style = require('./style')
var viewport = require('./viewport')

var div = tags('div')

var tooltip = module.exports = {
	show:showTooltip,
	hide:hideTooltip
}

function showTooltip(opts, contentFn) {
	if (!contentFn) { contentFn = opts; opts = {} }
	opts = tags.options(opts, {
		width:null, height:null, content:'Hello World', element:null, background:'rgba(0,0,0,0)',
		offset:[0,0]
	})
	var $el = $(opts.element)
	var offsetX = (opts.width - $el.width()) / 2
	var elPos = tags.addPos(tags.subPos(tags.subPos(tags.screenPos($el), viewport.pos()), [offsetX, opts.height]), opts.offset)
	
	hideTooltip()
	
	$(viewport.element).append(div(
		{ id:'tags-tooltip' },
		style({ position:'fixed', left:elPos[0], top:elPos[1], display:'table', zIndex:3 }),
		div('tags-tooltip-content', contentFn, style({
			display:'table-cell', width:opts.width, height:opts.height, verticalAlign:'middle'
		}))
	))
}

function hideTooltip() {
	$('#tags-tooltip').remove()
}
