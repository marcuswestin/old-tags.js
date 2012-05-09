tags.js
=======

A small library for creating dom. Made to work with jQuery.
-----------------------------------------------------------

Setup

	$(function() {
		tags.expose() // expose tag functions: div, span, p, h1, etc
	})

Creating DOM is easy!

	var $tasks = $(document.body)
	var task = { title:"Build dom creating library for jQuery", assignee:"Marcus", done:true }
	$tasks.append(
		div('task',
			// if the first argument is a string, it will be set as the class name of the element
			div('title', task.title),
			div('asignee', task.assignee),
			div('status', task.done ? 'Completed!' : 'Not done')
		)
	)
		

jQuery automatically operates on DOM created with tags

	var $person = $(div('person', 'Hello Marcus')).appendTo(document.body)
	$person.css('color', 'red')	

Some more tricks

	$(document.body).append(
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

Add-ons
-------

Tags comes with a bunch of convenient addons

`tags/style.js` - convenience function for adding styles to tags

	style = tags.style
	var $body = $(document.body)
	var bold = style({ fontWeight:'bold' })
	var floatingItalic = style({ 'float':'left', fontStyle:'italic' })
	// numeric arguments automatically get postfixed with "px" 
	var large = style({ fontSize:20, height:40 })
	$body.append(
		div('greeting', bold,
			span('header', 'Hello', bold)
			span('person', "Marcus", bold, floatingItalic),
			span('person', "Thomas", large, floatingItalic)
		)
	)

`tags/button.js` - make an element into a button (both for mouse and touch based devices)

	<script>
		$body = $(document.body)
		button = tags.button
		$body.append(
			div('button', "Click me!", button(function() {
				alert("Clicked!")
			}))
		)
	</script>
	<style type="text/css">
		/* Buttons get the "active" class applied to them during mousedown/touchdown */
		.button.active {
			color:red;
		}
	</style>

`tags/list.js` - create a lists of tappable items

	list = tags.list
	var $body = $(document.body)
	var people = [{ name:'Marcus' }, { name:'Thomas' }, { name:'Jon' }]
	var peopleList
	$body.append(
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

Custom add-ons
--------------

Custom add-ons is easy - just return a function! This one gives a div a random color

	var style = tags.style
	var randomColor = function($tag) {
		var colors = []
		for (var i=0; i<3; i++) {
			colors.push(Math.floor(Math.random() * 255))
		}
		$tag.css({ background:'rgb('+colors.join(',')+')' })
	}
	$(div(randomColor, style({ width:100, height:100 }))).appendTo(document.body)
