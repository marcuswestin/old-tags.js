tags.js
=======

A ~100 line library for creating dom. Made to work with jQuery.
---------------------------------------------------------------

All of the examples below work by simply copying and pasting them into any html document.

Setup

	<script src="http://code.jquery.com/jquery-1.7.2.min.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/tags.js"></script>
	<div id="tags-demo"></div>
	<script>
	$(function() {
		tags.expose() // expose tag functions: div, span, p, h1, etc
		$('#tags-demo').append(
			div('greeting', 'Hello world!')
		)
	})
	</script>

Creating DOM is easy!

	<script src="http://code.jquery.com/jquery-1.7.2.min.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/tags.js"></script>
	<div id="tags-demo"></div>
	<script>
	$(function() {
		tags.expose()
		var $taskList = $('#tags-demo')
		var task = { title:"Build dom creating library for jQuery", assignee:"Marcus", done:true }
		$taskList.append(
			div('task',
				// if the first argument is a string, it will be set as the class name of the element
				div('title', task.title),
				div('asignee', task.assignee),
				div('status', task.done ? 'Completed!' : 'Not done')
			)
		)
	})
	</script>		

jQuery automatically operates on DOM created with tags

	<script src="http://code.jquery.com/jquery-1.7.2.min.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/tags.js"></script>
	<div id="tags-demo"></div>
	<script>
	$(function() {
		tags.expose()
		var $person = $(div('person', 'Hello Marcus')).appendTo($('#tags-demo'))
		$person.css('color', 'red')
	})
	</script>

Some more tricks

	<script src="http://code.jquery.com/jquery-1.7.2.min.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/tags.js"></script>
	<div id="tags-demo"></div>
	<script>
	$(function() {
		tags.expose()
		$('#tags-demo').append(
			div('demo',
				// Text and number simply get rendered as text
				"Hello number ", 5,
				div('list people',
					// arrays of items all get appended to the parent element
					$.map(['Marcus', 'John', 'Thomas'], function(name) {
						return div('person', name)
					})
				),
				// functions get invoked when the tag is rendered, with the jquery-wrapped tag as its argument
				function($tag) {
					// Simulate loading data from server
					var $data = $(div('loading', 'Loading...')).appendTo($tag)
					setTimeout(function() {
						$data.empty().append('Data retrieved from server')
					}, 1000)
				}
			)
		)
	})
	</script>

Add-ons
-------

Tags comes with a bunch of convenient addons

`tags/style.js` - convenience function for adding styles to tags

	<script src="http://code.jquery.com/jquery-1.7.2.min.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/tags.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/style.js"></script>
	<div id="tags-demo"></div>
	<script>
	$(function() {
		tags.expose()
		var bold = style({ fontWeight:'bold' })
		var floatingItalic = style({ 'float':'left', fontStyle:'italic' })
		// numeric arguments automatically get postfixed with "px" 
		var large = style({ fontSize:20, height:40 })
		$('#tags-demo').append(
			div('greeting', bold,
				span('header', 'Hello', bold, style({ color:'green' })),
				span('person', "Marcus", bold, floatingItalic),
				span('person', "Thomas", large, floatingItalic)
			)
		)
	})
	</script>

`tags/button.js` - make an element into a button (both for mouse and touch based devices)

	<script src="http://code.jquery.com/jquery-1.7.2.min.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/tags.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/button.js"></script>
	<div id="tags-demo"></div>
	<script>
	$(function() {
		tags.expose()
		$(document.body).append(
			div('button', "Click me!", button(function() {
				alert("Clicked!")
			}))
		)
	})
	</script>
	<style type="text/css">
		/* Buttons get the "active" class applied to them during mousedown/touchdown */
		.button {
			border:4px solid #def; padding:5px; border-radius:10px; display:inline-block;
		}
		.button.active {
			background:#567; color:#fff;
		}
	</style>

`tags/list.js` - create a lists of tappable items

	<script src="http://code.jquery.com/jquery-1.7.2.min.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/tags.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/list.js"></script>
	<div id="tags-demo"></div>
	<script>
	$(function() {
		tags.expose()
		var people = [{ name:'Marcus' }, { name:'Thomas' }, { name:'Jon' }]
		var peopleList
		$('#tags-demo').append(
			div('people',
				peopleList=list(people, onSelect, function renderPerson(person) {
					return div('person', person.name)
				})
			)
		)
		function onSelect(person) {
			alert("Selected " + person.name)
		}
		// Add another item to the list
		peopleList.append({ name:'Paul' })
	})
	</script>

Custom add-ons
--------------

Custom add-ons is easy - just return a function! This one gives a div a random color

	<script src="http://code.jquery.com/jquery-1.7.2.min.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/tags.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/list.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/style.js"></script>
	<div id="tags-demo"></div>
	<script>
	$(function() {
		tags.expose()
		var randomColor = function($tag) {
			var colors = []
			for (var i=0; i<3; i++) {
				colors.push(Math.floor(Math.random() * 255))
			}
			$tag.css({ background:'rgb('+colors.join(',')+')' })
		}
		var square = style({ width:100, height:100 })
		$('#tags-demo').append(div(
			div(randomColor, square),
			div(randomColor, square),
			div(randomColor, square)
		))
	})
	</script>
	
