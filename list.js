var list = tags.list = function list(items, onSelect, render) {
	var data = { id:0 }
	var $tag
	function renderListItem(item, key) {
		var id = data.id++
		data[id] = { item:item, key:key }
		return div('list-item', { 'listId':id }, render(item, key))
	}
	
	var result = div(list.className, function(tag) {
		$tag = $(tag)
		list.init($tag, data, onSelect)
		$tag.append($.map(items || [], renderListItem))
	})
	
	result.append = function(item, key) { $tag.append(renderListItem(item, key)) }
	result.prepend = function(item, key) { $tag.prepend(renderListItem(item, key)) }
	
	return result
}

list.init = function($tag, data, onSelect) {
	if (!tags.isTouch) {
		$tag.on('click', '.list-item', function(event) {
			var result = data[$(this).attr('listId')]
			onSelect(result.item, result.key, event)
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
			var result = data[$(tapElement).attr('listId')]
			clear()
			onSelect(result.item, result.key, event)
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