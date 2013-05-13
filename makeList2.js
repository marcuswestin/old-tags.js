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
	var itemsById = {}
	
	nextTick(_setupEvents)
	
	return extend(div({ id:id }, (isEmpty ? opts.renderEmpty() : _renderItems(opts.items))),
		{
			append:append,
			prepend:prepend,
			getHeight:getHeight,
			empty:empty,
			destroy:destroy
		}
	)
	
	function destroy() {
		itemsById = null
		$('#'+id).off('touchstart').off('touchmove').off('touchend').off('click').off('mouseover').off('mouseout').empty()
	}
	
	function empty() {
		$('#'+id).empty()
		isEmpty = true
		itemsById = {}
		opts.renderEmpty()
	}
	
	function append(items) {
		_addItems(items, $.fn.append)
	}
	
	function prepend(items) {
		_addItems(items, $.fn.prepend)
	}
	
	function getHeight() {
		return $('#'+id).height()
	}
	
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
			var touch = $e.originalEvent.touches[0]
			var tapY = touch.pageY
			var tapElement = $e.currentTarget
			var touchStartTime = new Date().getTime()
			var waitToSeeIfScrollHappened = null

			function clear() {
				tapY = null
				tapElement = null
				$list.off('touchmove').off('touchend')
			}

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
