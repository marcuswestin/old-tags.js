var getId = function() { return getId.id++ }
getId.id = 1

var list = tags.list = function list(items, onSelect, idFun, render) {
	if (arguments.length == 3) {
		render = idFun
		idFun = getId
	}
	var data = {}
	var uniqueId = 'list-'+getId()+'-'
	var $tag
	function renderListItem(item) {
		var id = idFun(item)
		data[id] = item
		return div('list-item', { id:uniqueId+id, 'listId':id }, render(item))
	}
	
	function addItems(newItems, appendOrPrepend) {
		if (!$.isArray(newItems)) { newItems = [newItems] }
		for (var i=0; i<newItems.length; i++) {
			var item = newItems[i]
			var id = idFun(item)
			$tag.find('#'+uniqueId+id).remove()
			appendOrPrepend.call($tag, renderListItem(item))
		}
	}
	
	var result = div(list.className, function(tag) {
		$tag = $(tag)
		list.init($tag, data, onSelect)
		$tag.append($.map(items || [], renderListItem))
	})
	
	result.append = function(newItems) { addItems(newItems, $tag.append) }
	result.prepend = function(newItems) { addItems(newItems, $tag.prepend) }
	result.empty = function() {
		$tag.empty()
		return this
	}
	result.find = function(selector) { return $tag.find(selector) }
	
	return result
}

list.init = function($tag, data, onSelect) {
	if (!tags.isTouch) {
		$tag.on('click', '.list-item', function(event) {
			var $el = $(this)
			var id = $el.attr('listId')
			var result = data[id]
			onSelect(result, id, $el, event)
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
			var $el = $(tapElement)
			var id = $el.attr('listId')
			var result = data[id]
			clear()
			onSelect(result, id, $el, event)
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