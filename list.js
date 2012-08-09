var getId = function() { return 'list-item-'+(getId.id++) }
getId.id = 1

var list = tags.list = function list(opts) {
	opts = tags.options(opts, {
		items:null,
		onSelect:logOnSelect,
		getItemId:getId,
		renderItem:renderItemJson,
		reAddItems:false
	})
	
	var data = {}
	var uniqueId = 'list-'+getId()+'-'
	var $tag
	function renderListItem(item) {
		var id = opts.getItemId(item)
		data[id] = item
		return div('list-item', { id:id }, opts.renderItem(item))
	}
	
	function addItems(newItems, appendOrPrepend) {
		if (typeof newItems == 'undefined') { return }
		if (!$.isArray(newItems)) { newItems = [newItems] }
		var count = 0
		for (var i=0; i<newItems.length; i++) {
			var item = newItems[i]
			var id = opts.getItemId(item)
			if ($tag.find('#'+uniqueId+id).length) {
				if (opts.reAddItems) {
					$tag.find('#'+uniqueId+id).remove()
				} else {
					continue
				}
			}
			count++
			appendOrPrepend.call($tag, renderListItem(item))
		}
		return { newItems:count }
	}
	
	var result = div('dom-list', function(tag) {
		$tag = $(tag)
		list.init($tag, data, opts.onSelect)
		$tag.append($.map(opts.items || [], renderListItem))
	})
	
	result.append = function(newItems) { return addItems(newItems, $tag.append) }
	result.prepend = function(newItems) { return addItems(newItems, $tag.prepend) }
	result.height = function() { return $tag.height() }
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
			var id = $el.attr('id')
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
			var id = $el.attr('id')
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

function renderItemJson(item) {
	return div('json-item', JSON.stringify(item))
}

function logOnSelect(item) {
	console.log('tags-list item selected:', item)
}
