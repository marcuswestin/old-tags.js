var tags = require('./tags')

var options = tags.options
var extend = tags.extend
var classNames = tags.classNames

var defaultGetItemId = function(item) { return item.id ? item.id : defaultGetItemId.id++ }
defaultGetItemId.id = 1

module.exports = list

var data = {}
function list(className, opts) {
	if (arguments.length == 1) {
		opts = className
		className = null
	}
	if (opts.onSelect) { opts.selectItem = opts.onSelect } // backcompat
	opts = options(opts, {
		items:null,
		selectItem:logOnSelect,
		getItemId:defaultGetItemId,
		renderItem:renderItemJson,
		renderEmpty:function(){},
		onUpdated:function(){}
	})
	
	var listId = tags.id()
	var listData = data[listId] = {
		opts:opts,
		itemsById:{}
	}

	var isEmpty = !opts.items || !opts.items.length
	var result = div(classNames('tags-list', className),
		{ id:listId },
		isEmpty ? opts.renderEmpty() : map(opts.items, renderListItem)
	)
	
	setTimeout(function() {
		opts.onUpdated()
	})

	return extend(result, {
		getItemId: getItemId,
		_getItem: function(id) { return listData.itemsById[id] },
		append: listAppend,
		prepend: listPrepend,
		update: listUpdate,
		getHeight: getHeight,
		height: getHeight,
		selectItem: selectItem,
		select: selectItem,
		selectIndex: selectIndex,
		empty: empty,
		isEmpty: isEmpty,
		find: find,
		destroy: destroy
	})

	function destroy() {
		$tag().remove()
		delete data[listId]
	}

	/* Functions
	 ***********/
	function $tag() { return $('#'+listId) } // HACK
	
	function renderListItem(item) {
		var itemId = getItemId(item)
		listData.itemsById[itemId] = item
		return div('tags-list-item', { id:itemId }, opts.renderItem(item))
	}
	function renderEmpty() {
		isEmpty = true
		$tag().empty().append(opts.renderEmpty())
	}

	function getItemId(item) {
		return 'tags-list-item-'+opts.getItemId(item)
	}
	
	function addItems(newItems, addOpts, appendOrPrepend) {
		addOpts = options(addOpts, {
			moveItems:false,
			updateItems:false
		})
		if (typeof newItems == 'undefined') { return }
		if (!$.isArray(newItems)) { newItems = [newItems] }
		if (newItems.length == 0) {
			if (isEmpty) { renderEmpty() }
			return
		}
		if (isEmpty) { $tag().empty() } // Remove previous content from renderEmpty
		isEmpty = false
		var div = document.createElement('div')
		div.innerHTML = newItems.map(function itemHtml(item) {
			var itemId = getItemId(item)
			if (!listData.itemsById[itemId]) {
				return renderListItem(item)
			}

			if (addOpts.moveItems) {
				$('#'+itemId).remove()
				return renderListItem(item)
			} else if (addOpts.updateItems) {
				$('#'+itemId).empty().append(opts.renderItem(item))
				return ''
			} else {
				return ''
			}

		}).join('')
		appendOrPrepend && appendOrPrepend.call($tag(), div)
		opts.onUpdated()
	}
	
	function listAppend(newItems, opts) {
		opts = options(opts, { moveItems:true })
		return addItems(newItems, opts, $.fn.append)
	}

	function listPrepend(newItems, opts) {
		opts = options(opts, { moveItems:true })
		return addItems(newItems, opts, $.fn.prepend)
	}
	function listUpdate(newItems, opts) {
		opts = options(opts, { updateItems:true })
		return addItems(newItems, opts)
	}
	function getHeight() { return $tag().height() }
	
	function selectItem(item) {
		var el = $('#'+getItemId(item))[0]
		selectEl(el)
	}
	function selectIndex(index) {
		var el = $tag[0].children[index]
		selectEl(el)
	}
	function empty() {
		isEmpty = true
		listData.itemsById = {}
		$tag().empty().append(opts.renderEmpty())
		return this
	}
	function isEmpty() {
		return isEmpty
	}
	function find(selector) {
		return $tag().find(selector)
	}
}

function selectEl(el) {
	if (!el) { return }
	var listEl = el.parentNode
	while (listEl && !$(listEl).hasClass('tags-list')) {
		listEl = listEl.parentNode
	}
	var listId = listEl.getAttribute('id')
	if (!data[listId]) { return }
	var itemId = el.getAttribute('id')
	var item = data[listId].itemsById[itemId]
	if (!item) { return }
	data[listId].opts.selectItem.call(el, item)
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
