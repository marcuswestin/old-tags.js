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

tags.style = function style(styles) {
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