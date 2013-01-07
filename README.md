# tags.js

## A small & fast library for creating dom.

### **README Out of date**

This README is well out of date, but it gives a good idea of how the library works.

### Examples

All of the examples below work by simply copying and pasting them into any html document.

Setup

	<script src="http://code.jquery.com/jquery-1.8.1.min.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/tags.js"></script>
	<div id="tags-demo"></div>
	<script>
	var div = tags('div')
	$(function() {
		$('#tags-demo').append(
			div('greeting', 'Hello world!')
		)
	})
	</script>

Creating DOM is easy!

	<script src="http://code.jquery.com/jquery-1.8.1.min.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/tags.js"></script>
	<div id="tags-demo"></div>
	<script>
	var div = tags('div')
	var span = tags('span')
	$(function() {
		var $taskList = $('#tags-demo')
		var task = { title:"Build dom creating library for jQuery", assignee:"Marcus", done:true }
		$taskList.append(
			// if the first argument is a string, it will be set as the class name of the element
			div('task',
				span('title', task.title),
				span('asignee', task.assignee),
				span('status', task.done ? 'Completed!' : 'Not done')
			)
		)
		
		// jQuery operates on DOM created with tags
		var $person = $(div('person', 'Hello Marcus')).appendTo($('#tags-demo'))
		$person.css('color', 'red')
	})
	</script>		


Some more tricks

	<script src="http://code.jquery.com/jquery-1.8.1.min.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/tags.js"></script>
	<div id="tags-demo"></div>
	<script>
	$(function() {
		var div = tags('div')
		var span = tags('span')
		var a = tags('a')
		$('#tags-demo').append(
			div('demo',
				// Text and numbers simply get rendered in the DOM as text nodes
				"Hello number ", 5,
				div('list people',
					// arrays of items all get appended to the parent element
					$.map(['Marcus', 'John', 'Thomas'], function(name) {
						return a('person', name, { href:'/people/'+name })
					})
				),
				// functions get invoked and are expected to return html
				function() {
					setTimeout(function() {
						// Simulate loading data from server
						$('#loader).empty().append('Data retrieved from server')
					}, 1000)
					return span('loading', { id:'loader' }, 'Loading...')
				}
			)
		)
	})
	</script>

Custom tags
-----------

You can create any tags you want with `tags()`

	<script src="http://code.jquery.com/jquery-1.8.1.min.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/tags.js"></script>
	<div id="tags-demo"></div>
	<script>
	var foo = tags('foo')
	$(function() {
		$('#tags-demo').append(
			foo('thing', 'Hello there!' { id:'foo' }) // Results in <foo class="thing" id="foo">Hello there!</foo>
		)
	})
	</script>


Modules
-------

Tags comes with a bunch of convenient modules

`tags/style.js` - convenience function for adding styles to tags

	<script src="http://code.jquery.com/jquery-1.8.1.min.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/tags.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/style.js"></script>
	<div id="tags-demo"></div>
	<script>
	$(function() {
		var div = tags('div')
		var span = tags('span')
		var bold = style({ fontWeight:'bold' })
		var floatingItalic = style({ 'float':'left', fontStyle:'italic' })
		// numeric arguments automatically get postfixed with "px" 
		var large = style({ 'font-size':20, height:40 })
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

	<script src="http://code.jquery.com/jquery-1.8.1.min.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/tags.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/button.js"></script>
	<div id="tags-demo"></div>
	<script>
	$(function() {
		var div = tags('div')
		var $input
		$(document.body).append(
			$input = $(input({ placeholder:'What is your name?' })),
			div('button', "Greet", button(function() {
				alert("Hello "+$input.val())
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

	<script src="http://code.jquery.com/jquery-1.8.1.min.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/tags.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/list.js"></script>
	<div id="tags-demo"></div>
	<script>
	tags.expose()
	$(function() {
		var people = [{ name:'Marcus' }, { name:'Thomas' }, { name:'Jon' }]
		var peopleList = list({ items:people, onSelect:onSelect, renderItem:function renderPerson(person) {
			return div('person', person.name)
		}})
		$('#tags-demo').append(
			div('people', peopleList)
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

	<script src="http://code.jquery.com/jquery-1.8.1.min.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/tags.js"></script>
	<script src="https://raw.github.com/marcuswestin/tags.js/master/style.js"></script>
	<div id="tags-demo"></div>
	<script>
	$(function() {
		var div = tags('div')
		var randomColor = function() {
			var colors = []
			for (var i=0; i<3; i++) {
				colors.push(Math.floor(Math.random() * 255))
			}
			return {
				style:{ background:'rgb('+colors.join(',')+')' }
			}
		}
		var square = style({ width:100, height:100 })
		$('#tags-demo').append(
			div(randomColor, square),
			div(randomColor, square),
			div(randomColor, square)
		)
	})
	</script>
	
