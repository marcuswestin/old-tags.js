var tags = require('./tags')

var options = tags.options
var extend = tags.extend

module.exports = makeList2

function defaultGroupBy() { return 1 }
function defaultRenderGroupHead() { return '' }
function defaultUpdateGroupHead() {}

function makeList2(opts) {
	opts = options(opts, {
		getItemId:null,
		selectItem:null,
		groupBy:defaultGroupBy,
		renderGroupHead:defaultRenderGroupHead,
		updateGroupHead:defaultUpdateGroupHead, // Called when a group's contents updated. If it returns content, that becomes the new content
		renderItem:null,
		updateItem:null, // Called when an item needs updating. If it returns content, that becomes the new content
		renderEmpty:null
	})
	
	if (!opts.updateItem) {
		opts.updateItem = opts.renderItem
	}

	var id = tags.id()
	var isEmpty = true
	var itemsById = {}
	var itemsByGroupId = {}
	var groupsByGroupId = {}
	
	nextTick(_setupEvents)
	
	return extend(div({ id:id }, opts.renderEmpty()),
		{
			append:append,
			prepend:prepend,
			getHeight:getHeight,
			empty:empty,
			destroy:destroy
		}
	)
	
	function empty() {
		isEmpty = true
		itemsById = {}
		var el = tags.byId(id)
		tags.empty(el).append(el, opts.renderEmpty())
	}
	
	function append(items, info) {
		_addItems(items, info || {}, tags.append)
	}
	
	function prepend(items, info) {
		_addItems(items, info || {}, tags.prepend)
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
	
	function _addItems(items, info, appendOrPrepend) {
		if (!(items = _getItems(items))) { return }
		
		if (isEmpty) { tags.empty(tags.byId(id)) }
		isEmpty = false
		
		var newGroupsById = {}
		var newGroupsContentById = {}
		var newGroupIds = []
		var seenItemIds = {}
		var modifiedGroupsById = {}

		each(items, function groupItem(item) {
			var groupId = opts.groupBy(item)
			var itemId = opts.getItemId(item)
			
			if (!itemsByGroupId[groupId]) {
				itemsByGroupId[groupId] = {}
			}
			itemsByGroupId[groupId][itemId] = item
		})
		
		each(items, function addItem(item) {
			var itemId = opts.getItemId(item)
			var groupId = opts.groupBy(item)
			
			if (seenItemIds[itemId]) { return }
			seenItemIds[itemId] = true
			
			if (itemsById[itemId]) {
				// Item has previously been rendered
				var itemElement = _getElement(itemId)
				var newContent = opts.updateItem.call(itemElement, item)
				if (newContent) {
					tags.empty(itemElement).append(itemElement, newContent)
				}
				modifiedGroupsById[groupId] = true
				
			} else if (groupsByGroupId[groupId]) {
				itemsById[itemId] = item
				// Group has previously been rendered
				var groupContent = tags.byId(_getElementId(groupId)+' .tags-list2-groupContent')
				appendOrPrepend(groupContent, _renderItem(item, info))
				modifiedGroupsById[groupId] = true
				
			} else {
				itemsById[itemId] = item
				// Group has not yet been rendered
				if (!newGroupsById[groupId]) {
					newGroupsById[groupId] = div({ id:_getElementId(groupId) },
						div('tags-list2-groupHead', opts.renderGroupHead(itemsByGroupId[groupId]))
					)
					newGroupsContentById[groupId] = div('tags-list2-groupContent')
					newGroupIds.push(groupId)
				}
				newGroupsContentById[groupId].appendContent(_renderItem(item, info))
			}
		})

		each(modifiedGroupsById, function updateModifiedGroups(_, groupId) {
			var groupHeadElement = _getElement(groupId).children[0]
			var newContent = opts.updateGroupHead.call(groupHeadElement, itemsByGroupId[groupId])
			if (newContent) {
				tags.empty(groupHeadElement).append(groupHeadElement, result)
			}
		})
		
		if (newGroupIds.length) {
			appendOrPrepend(tags.byId(id),
				div(map(newGroupIds, function(groupId) {
					groupsByGroupId[groupId] = true
					newGroupsById[groupId].appendContent(newGroupsContentById[groupId])
					return newGroupsById[groupId]
				}))
			)
		}
	}
	
	function _renderItem(item, info) {
		return div('tags-list2-item', { id:_getElementId(opts.getItemId(item)) }, opts.renderItem(item, info))
	}
	
	function _getElement(itemId) {
		return document.getElementById(_getElementId(itemId))
	}
	
	function _getElementId(itemId) {
		return id+'-'+itemId
	}
	
	function _selectEl(el) {
		var idForItem = el.id.replace(id+'-', '')
		opts.selectItem.call(el, itemsById[idForItem])
	}
	
	function destroy() {
		itemsById = null
		$('#'+id).off('touchstart').off('touchmove').off('touchend').off('click').off('mouseover').off('mouseout').empty()
	}
	
	function _setupEvents() {
		var $list = $('#'+id)
		var targetClass = '.tags-list2-item'
		if (tags.isTouch) {
			_setupTouchEvents()
		} else {
			_setupMouseEvents()
		}
		
		function _setupTouchEvents() {
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
		
		function _setupMouseEvents() {
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
		}
	}
}
