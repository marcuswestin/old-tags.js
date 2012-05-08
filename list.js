var list = tags.list = function list(items, onSelect, render) {
	return div(list.className, function(tag) {
		list.init($(tag), items, onSelect, render)
	})
}

list.init = function($tag, items, onSelect, render) {
	var data = { id:0 }
	$tag.append($.map(items, function(item) {
		var id = data.id++
		data[id] = item
		return div('list-item', { 'listId':id }, render(item))
	}))
	
	if (!tags.isTouch) {
		$tag.on('click', '.list-item', function(event) {
			onSelect(data[$(this).attr('listId')])
		})
		return
	}
	
	var tapY = null
	var tapElement = null

	function clear() {
		tapY = null
		tapElement = null
	}
	
	$tag.on('touchstart', '.list-item', function onTouchStart(event) {
		var touch = event.originalEvent.touches[0]
		tapY = touch.pageY
		tapElement = event.currentTarget
	})

	$tag.on('touchmove', function onTouchMove(event) {
		if (!tapY) { return }
		var touch = event.originalEvent.touches[0]
		if (Math.abs(touch.pageY - tapY) > 10) {
			clear()
		}
	})

	$tag.on('touchend', function(event) {
		if (tapElement) {
			var item = data[$(tapElement).attr('listId')]
			clear()
			onSelect(item)
			event.preventDefault()
		} else {
			clear()
		}
	})

	$tag.on('touchend', function() {
		clear()
	})
} 

list.className = 'dom-list'