var tags = require('./tags')

var options = tags.options
var extend = tags.extend

module.exports = makeList2

function makeList2(opts) {
	opts = options(opts, {
		items:[],
		renderItem:null,
		renderEmpty:null,
		getItemId:null,
		updateItem:null,
		selectItem:null
	})
	
	var id = tags.id()
	var isEmpty = (opts.items.length == 0)
	var $groupById = {}
	var itemsById = {}
	
	nextTick(_setupEvents)
	
	return extend(div({ id:id }, (isEmpty ? opts.renderEmpty() : _renderItems(opts.items))),
		{
			append:append,
			prepend:prepend,
			getHeight:getHeight
			// update:update,
			// remove:remove
		}
	)
	
	function append(items) {
		_addItems(items, $.fn.append)
	}
	
	function prepend(items) {
		_addItems(items, $.fn.prepend)
	}
	
	function getHeight() {
		return $('#'+id).height()
	}
	
	// function update(items) {
	// 	if (!(items = _getItems(items))) { return }
	// 	each(items, function(item) {
	// 		opts.updateItem(item, $('#'+_getItemId(item)))
	// 	})
	// }
	
	// function remove(items) {
	// 	if (!(items = _getItems(items))) { return }
	// 	each(items, function(item) {
	// 		$('#'+_getItemId(item)).remove()
	// 	})
	// }
	
	function _getItems(items) {
		if (!items) { return null }
		if (!isArray(items)) { items = [items] }
		if (!items.length) { return null }
		return items
	}
	
	function _addItems(items, appendOrPrependFn) {
		if (!(items = _getItems(items))) { return }
		
		if (isEmpty) { $('#'+id).empty() }
		isEmpty = false
		
		var result = html(map(items, function addItem(item) {
			itemsById[opts.getItemId(item)] = item
			return _renderItem(item)
		}).join(''))
		appendOrPrependFn.call($('#'+id), result)
	}
	
	function _renderItem(item) {
		return div('tags-list2-item', { id:_getItemId(item) }, opts.renderItem(item))
	}
	
	function _getItemId(item) {
		return id+':'+opts.getItemId(item)
	}
	
	function _selectEl(el) {
		var idForItem = el.id.replace(id+':', '')
		opts.selectItem.call(el, itemsById[idForItem])
	}
	
	function _setupEvents() {
		var $list = $('#'+id)
		var targetClass = '.tags-list2-item'
		if (!tags.isTouch) {
			var $currentHighlight
			$list.on('click', targetClass, function onClick($e) {
				$e.preventDefault()
				_selectEl(this)
			})
			.on('mouseover', targetClass, function onMouseOver($e) {
				if ($currentHighlight) { $currentHighlight.removeClass('active') }
				var $currentHighlight = $(this).addClass('active')
			})
			.on('mouseout', targetClass, function onMouseOut ($e) {
				$(this).removeClass('active')
			})
			return
		}
		
		$list.on('touchstart', targetClass, function onTouchStart($e) {
			var tapY = null
			var tapElement = null
			var touchStartTime
			var waitToSeeIfScrollHappened

			function clear() {
				tapY = null
				tapElement = null
				$list.off('touchmove').off('touchend')
			}

			var touch = $e.originalEvent.touches[0]
			tapY = touch.pageY
			tapElement = $e.currentTarget
			touchStartTime = new Date().getTime()
			
			$list.on('touchmove', function onTouchMove($e) {
				if (!tapY) { return }
				var touch =$e.originalEvent.touches[0]
				if (Math.abs(touch.pageY - tapY) > 10) { clear() }
			})
			.on('touchend', function onTouchEnd($e) {
				clearTimeout(waitToSeeIfScrollHappened)
				if (!tapElement) { return clear() }
				waitToSeeIfScrollHappened = setTimeout(_doTap, 50)
				function _doTap() {
					var lastScrollEventHappenedSinceRightAroundTouchStart = (tags.__lastScroll__ > touchStartTime - 50)
					if (lastScrollEventHappenedSinceRightAroundTouchStart) { return } // in this case we want to just stop the scrolling, and not cause an item tap
					var el = tapElement
					clear()
					$e.preventDefault()
					_selectEl(el)
				}
			})
		})
	}
}
