var tags = require('./tags')

var defaultGetItemId = function(item) { return item.id ? item.id : defaultGetItemId.id++ }
defaultGetItemId.id = 1

module.exports = list

var data = {}
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
		renderEmpty:null
	})
	
	var listId = tags.id()
	var listData = data[listId] = {
		opts:opts,
		itemsById:{}
	}
	
	function renderListItem(item) {
		var itemId = getItemId(item)
		listData.itemsById[itemId] = item
		return div('tags-list-item', { id:itemId }, opts.renderItem(item))
	}
	
	function addItems(newItems, addOpts, appendOrPrepend) {
		addOpts = tags.options(addOpts, {
			updateItems:false
		})
		if (typeof newItems == 'undefined') { return }
		if (!$.isArray(newItems)) { newItems = [newItems] }
		if (newItems.length == 0) {
			if (isEmpty) { renderEmpty() }
			return
		}
		if (isEmpty && opts.renderEmpty) { $tag().empty() } // Remove previous content from renderEmpty
		isEmpty = false
		var div = document.createElement('div')
		div.innerHTML = newItems.map(function(item) {
			var itemId = getItemId(item)
			if (listData.itemsById[itemId]) {
				if (!addOpts.updateItems) { return '' }
				$('#'+itemId).remove()
			}
			return renderListItem(item)
		}).join('')
		appendOrPrepend.call($tag(), div)
	}
	
	var getItemId = function(item) { return 'tags-list-item-'+opts.getItemId(item) }
	var isEmpty = !opts.items || !opts.items.length
	var result = div(tags.classNames('tags-list', className), { id:listId },
		isEmpty ? opts.renderEmpty() : map(opts.items, renderListItem))
	
	var $tag = function() { return $('#'+listId) } // HACK
	
	var renderEmpty = function() {
		isEmpty = true
		if (opts.renderEmpty) { $tag().empty().append(opts.renderEmpty()) }
	}
	
	result.getItemId = getItemId
	result._getItem = function(id) { return listData.itemsById[id] }
	result.append = function listAppend(newItems, opts) { return addItems(newItems, opts, $tag().append) }
	result.prepend = function listPrepend(newItems, opts) { return addItems(newItems, opts, $tag().prepend) }
	result.height = function() { return $tag().height() }
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
		$tag().empty()
		listData.itemsById = {}
		if (opts.renderEmpty) {
			$tag().append(opts.renderEmpty())
		}
		return this
	}
	result.isEmpty = function() { return isEmpty }
	result.find = function(selector) { return $tag().find(selector) }

	return result
}

function selectEl(el) {
	var listEl = el.parentNode
	while (!$(listEl).hasClass('tags-list')) {
		listEl = listEl.parentNode
		if (!listEl) { return }
	}
	var listId = listEl.getAttribute('id')
	if (!data[listId]) { return }
	var itemId = el.getAttribute('id')
	var item = data[listId].itemsById[itemId]
	if (!item) { return }
	data[listId].opts.onSelect.call(el, item)
}

$(function() {
	if (tags.isTouch) {
		var tapY = null
		var tapElement = null

		function clear() {
			tapY = null
			tapElement = null
		}

		var touchStartTime
		$(document).on('touchstart', '.tags-list-item', function onTouchStart(event) {
			var touch = event.originalEvent.touches[0]
			tapY = touch.pageY
			tapElement = event.currentTarget
			touchStartTime = new Date().getTime()
		})

		$(document).on('touchmove', function onTouchMove(event) {
			if (!tapY) { return }
			var touch = event.originalEvent.touches[0]
			if (Math.abs(touch.pageY - tapY) > 10) {
				clear()
			}
		})

		var waitToSeeIfScrollHappened
		$(document).on('touchend', function(event) {
			clearTimeout(waitToSeeIfScrollHappened)
			if (!tapElement) { return clear() }
			waitToSeeIfScrollHappened = setTimeout(function() {
				var lastScrollEventHappenedSinceRightAroundTouchStart = (tags.__lastScroll__ > touchStartTime - 50)
				if (lastScrollEventHappenedSinceRightAroundTouchStart) { return } // in this case we want to just stop the scrolling, and not cause an item tap
				var el = tapElement
				clear()
				event.preventDefault()
				selectEl(el)
			}, 50)
		})
	} else {
		var $currentHighlight
		$(document)
			.on('click', '.tags-list-item', function onClick($e) {
				$e.preventDefault()
				selectEl(this)
			})
			.on('mouseover', '.tags-list-item', function onMouseOver($e) {
				if ($currentHighlight) { $currentHighlight.removeClass('active') }
				var $currentHighlight = $(this).addClass('active')
			})
			.on('mouseout', '.tags-list-item', function onMouseOut ($e) {
				$(this).removeClass('active')
			})
	}
})

function renderItemJson(item) {
	return div('json-item', JSON.stringify(item))
}

function logOnSelect(item) {
	console.log('tags-list item selected:', item)
}
