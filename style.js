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

var style = module.exports = (function(){
	function toDashes(name) {
		return name.replace(/([A-Z])/g, function($1) {
			return "-" + $1.toLowerCase()
		})
	}
	function handleStyle(value, name) {
		if (typeof value == 'number' && name != 'opacity' && name != 'zIndex') { value += 'px' }
		return toDashes(name)+':'+value
	}
	return function style(styles) {
		return styles && (arguments.length == 1
			? { style:$.map(styles, handleStyle).join('; ') }
			: map(arguments, style, function(arg) { return style(arg) })
		)
	}
}())

style.transition = function transition(properties, duration) {
	if (typeof properties == 'object') {
		var res = []
		for (var key in properties) {
			res.push(key+' '+properties[key]+'ms')
		}
		return { '-webkit-transition':res.join(',') }
	} else {
		return { '-webkit-transition':properties+' '+duration+'ms' }
	}
}

style.transition.none = function() {
	return { '-webkit-transition':'none' }
}

style.translate = function translate(x, y, duration, delay) {
	var res = { '-webkit-transform':'translate3d('+Math.round(x)+'px, '+Math.round(y)+'px, 0px)' }
	if (duration != null) {
		res['-webkit-transition'] = '-webkit-transform '+Math.round(duration)+'ms'
	}
	if (delay != null) {
		res['-webkit-transition-delay'] = delay+'ms'
	}
	return res
}

style.translate.y = function(y, duration, delay) {
	return style.translate(0, y, duration, delay)
}

style.translate.x = function(x, duration, delay) {
	return style.translate(x, 0, duration, delay)
}

style.scrollable = {
	x: { overflowX:'auto', '-webkit-overflow-scrolling':'touch', overflowY:'hidden' },
	y: { overflowY:'auto', '-webkit-overflow-scrolling':'touch', overflowX:'hidden' }
}
