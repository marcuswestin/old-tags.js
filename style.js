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

var nonPxStyles = { opacity:1, zIndex:1, fontWeight:1 }
var prefixed = { 'backface-visibility':1, 'transform':1, 'perspective':1, 'transform-style':1, 'transition':1 }
var style = module.exports = (function(){
	function toDashes(name) {
		name = name.replace(/([A-Z])/g, function($1) {
			return "-" + $1.toLowerCase()
		})
		return (prefixed[name] ? '-webkit-'+name : name)
	}
	function handleStyle(value, name) {
		if (typeof value == 'number' && !nonPxStyles[name]) { value += 'px' }
		return toDashes(name)+':'+value
	}
	return function style(styles) {
		return styles && (arguments.length == 1
			? { style:$.map(styles, handleStyle).join('; ') }
			: map(arguments, function(arg) { return style(arg) })
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

function _transform(transformation, duration, delay) {
	var res = { '-webkit-transform':transformation }
	if (duration != null && !isNaN(duration)) { res['-webkit-transition'] = '-webkit-transform '+Math.round(duration)+'ms' }
	if (delay != null && !isNaN(delay)) { res['-webkit-transition-delay'] = delay+'ms' }
	return res
}

style.translate = function translate(x, y, duration, delay) {
	return _transform('translate3d('+Math.round(x)+'px, '+Math.round(y)+'px, 0px)', duration, delay)
}
style.translate.y = function(y, duration, delay) {
	return _transform('translateY('+Math.round(y)+'px)', duration, delay)
}
style.translate.x = function(x, duration, delay) {
	return _transform('translateX('+Math.round(x)+'px)', duration, delay)
}
style.translate.z = function(z, duration, delay) {
	return _transform('translateZ('+Math.round(z)+'px)', duration, delay)
}
style.translate.xyz = function(x,y,z, duration, delay) {
	return _transform('translate3d('+Math.round(x)+'px, '+Math.round(y)+'px, '+Math.round(z)+'px)', duration, delay)
}

style.rotate = function(fraction, duration, delay) {
	return _transform('rotate('+Math.round(fraction*360)+'deg)', duration, delay)
}

style.scrollable = {
	x: { overflowX:'auto', '-webkit-overflow-scrolling':'touch', overflowY:'hidden' },
	y: { overflowY:'auto', '-webkit-overflow-scrolling':'touch', overflowX:'hidden' }
}
