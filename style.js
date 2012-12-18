/*
	var floating = style({ 'float':'left' })
	var bold = style({ fontWeight:'bold' })
	$(document.body).append(
		div('demo', style({ height:200, widht:200, color:'#333' }),
			span('name', style({ fontSize:20 }), floating, bold, 'Marcus'),
			span(floating, 'Cool!')
		)
	)
*/

var style = module.exports = function style(styles) {
	if (arguments.length > 1) {
		var args = [{}].concat(Array.prototype.slice.call(arguments))
		styles = $.extend.apply($, args)
	}
	return function($tag) {
		var elStyle = $tag[0].style
		for (var name in styles) {
			var value = styles[name]
			if (typeof value == 'number' && name != 'opacity' && name != 'zIndex') { value += 'px' }
			else if (name == 'float') { name = 'cssFloat' }
			elStyle[name] = value
		}
	}
}

style.disableSelection = style({
	'-moz-user-select':'none',
	webkitUserSelect:'none',
	'user-select':'none',
	'-ms-user-select':'none'
})

style.transition = function(properties, duration) {
	return {
		// -webkit-transition-timing-function: 'linear',
		'-webkit-transition-property': properties,
		'-webkit-transition-duration': duration+'ms'
	}
}
style.transition.none = function(properties) {
	return style.transition(properties, 0)
}

style.translate = function(x, y, duration) {
	var res = { webkitTransform:'translate3d('+Math.round(x)+'px, '+Math.round(y)+'px, 0px)' }
	if (duration != null) {
		res.webkitTransition = '-webkit-transform '+Math.round(duration)+'ms'
	}
	return res
}
style.translate.y = function(y, duration) { return style.translate(0, y, duration) }
style.translate.x = function(x, duration) { return style.translate(x, 0, duration) }
