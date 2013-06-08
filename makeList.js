var tags = require('./tags')
var options = require('std/options')
var extend = require('std/extend')

module.exports = makeList

function defaultGroupBy() { return 1 }
function defaultRenderGroupHead() { return '' }
function defaultUpdateGroupHead() {}

var Data = {}

function makeList(opts) {
	opts = options(opts, {
		getItemId:null,
		selectItem:null,
		groupBy:defaultGroupBy,
		renderGroupHead:defaultRenderGroupHead,
		updateGroupHead:defaultUpdateGroupHead, // Called when a group's contents updated. If it returns content, that becomes the new content
		renderItem:null,
		updateItem:null, // Called when an item needs updating. If it returns content, that becomes the new content
		renderEmpty:null,
		
		cache: opts.cache && options(opts.cache, {
			uid:null,
			groupShouldBeCached:null,
			persist:null,
			writeDelay:100
		})
	})
	
	var uid = opts.cache ? opts.cache.uid : tags.uid()
	var isEmpty = true
	
	var renderedItemsById = {} // Tracks items which have been rendered
	var renderedGroupsById = {} // Tracks groups which have been rendered
	var groupHtmlCacheById = {} // A lookup table of per-group cached HTML
	var itemsByGroupId = {} // Stores all items currently displayed

	Data[uid] = { selectItem:opts.selectItem, itemsByGroupId:itemsByGroupId }

	if (!uid) {
		throw new Error('makeList with caching requires cache.uid to be set')
	}

	if (!opts.updateItem) {
		opts.updateItem = opts.renderItem
	}
	
	/* List instance API
	 *******************/
	return extend(div('tags-list', attr({ id:uid }), opts.renderEmpty()),
		{
			uid:uid,
			append:append,
			prepend:prepend,
			getHeight:getHeight,
			empty:empty,
			destroy:destroy,
			setCache:setCache
		}
	)
	
	function empty() {
		isEmpty = true
		var el = tags.byId(uid)
		tags.empty(el).append(el, opts.renderEmpty())
		return this
	}
	
	function append(items, info) {
		_addItemsToList(items, info || {}, tags.append)
	}
	
	function prepend(items, info) {
		_addItemsToList(items, info || {}, tags.prepend)
	}
	
	function getHeight() {
		return $('#'+uid).height()
	}
	
	function setCache(cache) {
		if (!opts.cache) { return }
		groupHtmlCacheById = cache || {}
	}
	
	function destroy() {
		$('#'+uid).remove().empty()
		delete Data[uid]
	}
	
	/* Internals
	 ***********/
	function _addItemsToList(items, info, appendOrPrepend) {
		// Ensure items is a non-empty list
		if (!items) { return }
		if (!isArray(items)) { items = [items] }
		if (!items.length) { return }
		
		// If we are currently empty, remove the empty message
		if (isEmpty) { tags.empty(tags.byId(uid)) }
		isEmpty = false
		
		// State for this rendering cycle:
		var newGroupsById = {} // Tracks new groups which should be rendered
		var newGroupsOrder = [] // Tracks order of new groups which should be rendered
		var dirtyGroupsById = {} // Tracks old groups which require updating 
		var dirtyItemsById = {} // Tracks old items which require updating
		var duplicateItemsById = {} // Detects duplicate items appearing twice **in this call to _addItemsToList**

		// Store new in internal map 
		each(items, function groupItem(item) {
			var groupId = opts.groupBy(item)
			var itemId = opts.getItemId(item)
			if (!itemsByGroupId[groupId]) { itemsByGroupId[groupId] = {} }
			itemsByGroupId[groupId][itemId] = item
		})
		
		// Loop over new items and render them
		each(items, function addItem(item) {
			var itemId = opts.getItemId(item)
			var groupId = opts.groupBy(item)
			
			// Is this a duplicate item? Ignore it.
			if (duplicateItemsById[itemId]) { return }
			duplicateItemsById[itemId] = true
			
			if (groupHtmlCacheById[groupId]) {
				// Entire group can be rendered from cache
				if (!newGroupsById[groupId]) {
					newGroupsOrder.push(groupId)
					newGroupsById[groupId] = { fromCache:true }
				}
				
			} else if (renderedItemsById[itemId]) {
				// Item has previously been rendered. Item and group should both be updated
				dirtyItemsById[itemId] = groupId
				dirtyGroupsById[groupId] = groupId
				
			} else if (renderedGroupsById[groupId]) {
				// Group has previously been rendered, but item has not. Group DOM should be updated, and item should be rendered
				renderedItemsById[itemId] = true
				var groupContent = tags.byId(_getElementId(groupId)+' .tags-list-groupContent')
				appendOrPrepend(groupContent, _renderItem(item, info))
				dirtyGroupsById[groupId] = groupId
				
			} else {
				// Neither group nor item has previously been rendered. Both should be rendered.
				renderedItemsById[itemId] = true
				if (!newGroupsById[groupId]) {
					newGroupsOrder.push(groupId)
					newGroupsById[groupId] = _makeNewGroup(groupId)
				}
				newGroupsById[groupId].content.push(_renderItem(item, info))
			}
		})
		
		// Update dirty items
		each(dirtyItemsById, function updateDirtyItem(groupId, itemId) {
			var itemElement = _getElement(itemId)
			var updatedContent = opts.updateItem.call(itemElement, itemsByGroupId[groupId][itemId])
			if (updatedContent) { tags.empty(itemElement).append(itemElement, updatedContent) }
		})
		
		// Update dirty groups
		each(dirtyGroupsById, function updateDirtyGroup(groupId) {
			var groupElement = _getElement(groupId)
			var groupHeadElement = groupElement.children[0]
			var updatedContent = opts.updateGroupHead.call(groupHeadElement, itemsByGroupId[groupId])
			if (updatedContent) { tags.empty(groupHeadElement).append(groupHeadElement, updatedContent) }
			// Possibly cache the updated group content
			_onNewGroupHtml(groupId, groupElement)
		})
		
		// Actually render the new groups contents
		var newContent = array(newGroupsOrder, function(groupId) {
			var newGroup = newGroupsById[groupId]
			renderedGroupsById[groupId] = true
			if (newGroup.fromCache) { return dangerouslyInsertHtml(groupHtmlCacheById[groupId]) }
			return div('tags-list-group', attr({ id:_getElementId(groupId) }),
				div('tags-list-groupHead', opts.renderGroupHead(itemsByGroupId[groupId])),
				div('tags-list-groupContent', newGroup.content)
			)
		})
		
		if (newContent.length) {
			// Render new content, and possibly cache the updated groups
			appendOrPrepend(tags.byId(uid), newContent)
			if (opts.cache) {
				each(newGroupsOrder, function(groupId) {
					if (newGroupsById[groupId].fromCache) { return } // if it was rendered from cache we don't need to update the cache
					_onNewGroupHtml(groupId, _getElement(groupId))
				})
			}
		}
	}
	
	function _makeNewGroup(groupId) {
		return { groupId:groupId, content:[] }
	}
	
	function _renderItem(item, info) {
		return div('tags-list-item', attr({ id:_getElementId(opts.getItemId(item)) }), opts.renderItem(item, info))
	}
	
	function _getElement(itemId) {
		return document.getElementById(_getElementId(itemId))
	}
	
	function _getElementId(itemId) {
		return uid+'-'+itemId
	}
	
	function _onNewGroupHtml(groupId, groupElement) {
		if (!opts.cache) { return }
		if (!opts.cache.groupShouldBeCached(groupId)) { return }
		groupHtmlCacheById[groupId] = groupElement.outerHTML
		if (_onNewGroupHtml.scheduled) { return }
		_onNewGroupHtml.scheduled = true
		setTimeout(function() {
			_onNewGroupHtml.scheduled = false
			opts.cache.persist(groupHtmlCacheById)
		}, opts.cache.writeDelay)
	}
}

$(function() {
	$(document).on(tags.events.start, '.tags-list-item', function onTouchStart($e) {
		var itemElement = $e.currentTarget
		var $list = $(tags.above(itemElement, 'tags-list'))
		var pointer = tags.pointer($e)
		var tapY = pointer.y
		var startTime = new Date().getTime()
		var waitToSeeIfScrollHappened = null

		$list.on(tags.events.move, function onTouchMove($e) {
			if (!tapY) { return }
			var touch = $e.originalEvent.touches[0]
			if (Math.abs(touch.pageY - tapY) > 10) { _clear() }
		})
		
		$list.on(tags.events.end, function onTouchEnd($e) {
			clearTimeout(waitToSeeIfScrollHappened)
			if (!itemElement) { return _clear() }
			waitToSeeIfScrollHappened = setTimeout(_doTap, 50)
			function _doTap() {
				var lastScrollEventHappenedSinceRightAroundTouchStart = (tags.__lastScroll__ > startTime - 50)
				if (lastScrollEventHappenedSinceRightAroundTouchStart) { return } // in this case we want to just stop the scrolling, and not cause an item tap
				var el = itemElement
				_clear()
				$e.preventDefault()
				_selectEl(el)
			}
		})
		
		function _clear() {
			tapY = null
			itemElement = null
			$list.off(tags.events.move).off(tags.events.end)
		}
	})

	function _selectEl(el) {
		var listEl = tags.above(el, 'tags-list')
		var uid = listEl.id
		var data = Data[uid]

		var groupEl = tags.above(el, 'tags-list-group')
		var idForGroup = groupEl.id.replace(uid+'-', '')

		var idForItem = el.id.replace(uid+'-', '')
		var item = data.itemsByGroupId[idForGroup][idForItem]
		data.selectItem.call(el, item)
	}
})
