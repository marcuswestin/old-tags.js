tags.js
=======

A small, fast & standalone convenience library for building dom.
----------------------------------------------------------------

	$(function() {
		tags.expose() // expose div, span, etc and the style function
	
		div('demo',
			div('greeting', 'Hello world!'), // if the first argument is a string, tags.js will set it as the class name
			div('greeting', 'Hello tags world!', style({ fontSize:20 })), // number style values get 'px' added automatically
			$.map(['Marcus', 'John', 'Thomas'], function(name) {
				return div('person', 'Hello ', name)
			})
		).appendTo(document.body)
	
		$(document).on('click', '.person', function(e) {
			console.log('click', e.target)
		})
	})
