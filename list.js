var tags = require('./tags')
var div = tags('div')

var defaultGetItemId = function(item) { return item.id ? item.id : defaultGetItemId.id++ }
defaultGetItemId.id = 1

module.exports = list

function list(className, opts) {
	if (arguments.length == 1) {
		opts = className
		className = null
	}
	opts = tags.options(opts, {
		items:null,
		onSelect:logOnSelect,
		getItemId:defaultGetItemId,
		renderItem:renderItemJson,
		reAddItems:false,
		renderEmpty:null
	})
	
	var data = {}
	var $tag
	var isEmpty = false
	
	function renderListItem(item) {
		var id = getItemId(item)
		data[id] = item
		return div('tags-list-item', { id:id }, opts.renderItem(item))
	}
	
	function addItems(newItems, appendOrPrepend) {
		if (typeof newItems == 'undefined') { return }
		if (!$.isArray(newItems)) { newItems = [newItems] }
		if (newItems.length == 0) { return }
		if (isEmpty && opts.renderEmpty) { $tag.empty() } // Remove previous content from renderEmpty
		var count = 0
		for (var i=0; i<newItems.length; i++) {
			appendItem(newItems[i], appendOrPrepend)
			count++
		}
		isEmpty = false
		return { newItems:count }
	}
	
	function appendItem(item, appendOrPrepend) {
		var id = getItemId(item)
		if ($tag.find('#'+id).length) {
			if (!opts.reAddItems) {
				return
			}
			$tag.find('#'+id).remove()
		}
		appendOrPrepend.call($tag, renderListItem(item))
	}
	
	var getItemId = function(item) { return 'tags-list-item-'+opts.getItemId(item) }
	var result = div(tags.classNames('tags-list', className), function(_$tag) {
		$tag = _$tag
		list.init($tag, selectEl)
		var items = opts.items || []
		if (items.length) {
			$tag.append($.map(items, renderListItem))
		} else {
			isEmpty = true
			if (opts.renderEmpty) { $tag.append(opts.renderEmpty()) }
		}
	})
	result.getItemId = getItemId
	result.append = function listAppend(newItems) { return addItems(newItems, $tag.append) }
	result.prepend = function listPrepend(newItems) { return addItems(newItems, $tag.prepend) }
	result.height = function() { return $tag.height() }
	result.update = function(item) {
		var itemId = getItemId(item)
		var $el = $('#'+itemId)
		data[itemId] = item
		$el.empty().append(opts.renderItem(item))
	}
	result.select = result.selectItem = function(item) {
		var el = $('#'+getItemId(item))[0]
		selectEl(el)
	}
	result.selectIndex = function(index) {
		var el = $tag[0].children[index]
		selectEl(el)
	}
	result.empty = function() {
		isEmpty = true
		$tag.empty()
		data = {}
		if (opts.renderEmpty) {
			$tag.append(opts.renderEmpty())
		}
		return this
	}
	result.find = function(selector) { return $tag.find(selector) }

	function selectEl(el) {
		var id = el.getAttribute('id')
		var result = data[id]
		if (result == null) { return }
		opts.onSelect.call(el, result)
	}
	
	return result
}

list.init = function($tag, selectEl) {
	if (!tags.isTouch) {
		$tag.on('mousedown', '.tags-list-item', function($e) {
			$e.preventDefault()
			selectEl(this)
		})
		var $currentHighlight
		$tag.on('mouseover', '.tags-list-item', function($e) {
			if ($currentHighlight) { $currentHighlight.removeClass('active') }
			var $currentHighlight = $(this).addClass('active')
		})
		$tag.on('mouseout', '.tags-list-item', function($e) {
			$(this).removeClass('active')
		})
		
		return
	}
	
	var tapY = null
	var tapElement = null

	function clear() {
		tapY = null
		tapElement = null
	}
	
	$tag.on('touchstart', '.tags-list-item', function onTouchStart(event) {
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
			var el = tapElement
			clear()
			event.preventDefault()
			selectEl(el)
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
