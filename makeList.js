var tags = require('./tags')
var options = require('std/options')
var setProps = require('std/setProps')

module.exports = makeList

function defaultGroupBy() { return 1 }
function defaultRenderGroupHead() { return '' }
function defaultUpdateGroupHead() {}

var Data = {}

function _destroyList(uid) {
	delete Data[uid]
}

function makeList(opts) {
	opts = options(opts, {
		getItemId:null,
		selectItem:null,
		toggleActive:function(){},
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
	
	var renderedGroupsById = {} // Tracks groups which have been rendered
	var groupHtmlCacheById = {} // A lookup table of per-group cached HTML
	var itemsByGroupId = {} // Stores all items currently displayed
	var renderItemCount
	var updateItemCount
	var totalItemCount

	Data[uid] = { opts:opts, itemsByGroupId:itemsByGroupId }

	if (!uid) {
		throw new Error('makeList with caching requires cache.uid to be set')
	}

	if (!opts.updateItem) {
		opts.updateItem = opts.renderItem
	}
	
	/* List instance API
	 *******************/
	return setProps(
		div('tags-list', attr({ id:uid }), opts.renderEmpty(), tags.destructible(_destroyList)),
		{
			uid:uid,
			append:append,
			prepend:prepend,
			getHeight:getHeight,
			empty:empty,
			setCache:setCache
		}
	)
	
	function empty() {
		isEmpty = true
		tags.byId(uid).empty().append(opts.renderEmpty())
		return this
	}
	
	function append(items, info) {
		_addItemsToList(items, info, tags.dom.append)
	}
	
	function prepend(items, info) {
		_addItemsToList(items, info, tags.dom.prepend)
	}
	
	function getHeight() {
		return tags.byId(uid).height()
	}
	
	function setCache(cache) {
		if (!opts.cache) { return }
		groupHtmlCacheById = cache || {}
	}
	
	/* Internals
	 ***********/
	function _addItemsToList(items, info, appendOrPrepend) {
		// Ensure items is a non-empty list
		if (!items) { return }
		if (!isArray(items)) { items = [items] }
		if (!items.length) { return }
		
		// If we are currently empty, remove the empty message
		if (isEmpty) { tags.byId(uid).empty() }
		isEmpty = false
		
		// State for this rendering cycle:
		var newGroupsById = {} // Tracks new groups which should be rendered
		var newGroupsOrder = [] // Tracks order of new groups which should be rendered
		var dirtyGroupsById = {} // Tracks old groups which require updating 
		var dirtyItemsById = {} // Tracks old items which require updating
		var duplicateItemsById = {} // Detects duplicate items appearing twice **in this call to _addItemsToList**
		renderItemCount = 0
		updateItemCount = 0
		totalItemCount = items.length

		// Loop over new items and render them
		each(items, function addItem(item) {
			var itemId = opts.getItemId(item)
			var groupId = opts.groupBy(item)
			
			if (!itemsByGroupId[groupId]) { itemsByGroupId[groupId] = {} }
			
			// Is this a duplicate item? Ignore it.
			if (duplicateItemsById[itemId]) { return }
			duplicateItemsById[itemId] = true
			
			if (groupHtmlCacheById[groupId]) {
				// Entire group can be rendered from cache
				if (!newGroupsById[groupId]) {
					newGroupsOrder.push(groupId)
					newGroupsById[groupId] = { fromCache:true }
				}
				
			} else if (itemsByGroupId[groupId][itemId]) {
				// Item has previously been rendered. Item and group should both be updated
				dirtyItemsById[itemId] = item
				dirtyGroupsById[groupId] = groupId
				
			} else if (renderedGroupsById[groupId]) {
				// Group has previously been rendered, but item has not. Group DOM should be updated, and item should be rendered
				var groupContent = tags.byId(_getElementId(groupId)+' .tags-list-groupContent')
				appendOrPrepend(groupContent.el, _renderItem(item, info))
				dirtyGroupsById[groupId] = groupId
				
			} else {
				// Neither group nor item has previously been rendered. Both should be rendered.
				if (!newGroupsById[groupId]) {
					newGroupsOrder.push(groupId)
					newGroupsById[groupId] = _makeNewGroup(groupId)
				}
				newGroupsById[groupId].content.push(_renderItem(item, info))
			}
		})
		
		// Update dirty items
		each(dirtyItemsById, function updateDirtyItem(item, itemId) {
			_updateItem(item, itemId, info)
		})
		
		// Store items internal map
		each(items, function groupItem(item) {
			var groupId = opts.groupBy(item)
			var itemId = opts.getItemId(item)
			if (!itemsByGroupId[groupId]) { itemsByGroupId[groupId] = {} }
			itemsByGroupId[groupId][itemId] = item
		})
		
		// Update dirty groups
		each(dirtyGroupsById, function updateDirtyGroup(groupId) {
			var groupElement = _getTag(groupId).el
			var groupHeadElement = groupElement.children[0]
			var updatedContent = opts.updateGroupHead.call(groupHeadElement, itemsByGroupId[groupId])
			if (updatedContent) { tags.wrap(groupHeadElement).empty().append(updatedContent) }
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
			appendOrPrepend(tags.byId(uid).el, newContent)
			if (opts.cache) {
				each(newGroupsOrder, function(groupId) {
					if (newGroupsById[groupId].fromCache) { return } // if it was rendered from cache we don't need to update the cache
					_onNewGroupHtml(groupId, _getTag(groupId).el)
				})
			}
		}
	}
	
	function _setInfo(info, moreInfo) {
		if (!info) { info = {} }
		each(moreInfo, function(val, key) {
			if (info[key] != null) { throw new Error('Overriding info property: '+key) }
			info[key] = val
		})
		return info
	}
	
	function _makeNewGroup(groupId) {
		return { groupId:groupId, content:[] }
	}
	
	function _renderItem(item, info) {
		info = copy(info, { renderItemCount:renderItemCount, totalItemCount:totalItemCount })
		renderItemCount += 1
		return div('tags-list-item', attr({ id:_getElementId(opts.getItemId(item)) }), opts.renderItem(item, info))
	}
	
	function _updateItem(item, itemId, info) {
		var groupId = opts.groupBy(item)
		var itemTag = _getTag(itemId)
		var itemBefore = itemsByGroupId[groupId][itemId]
		info = copy(info, { itemBefore:itemBefore, updateItemCount:updateItemCount, totalItemCount:totalItemCount })
		updateItemCount += 1
		var updatedContent = opts.updateItem.call(itemTag.el, item, info)
		if (updatedContent) { itemTag.empty().append(updatedContent) }
	}
	
	function _getTag(itemId) {
		return tags.byId(_getElementId(itemId))
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
		var el = $e.currentTarget
		var list = tags.dom.above(el, 'tags-list')
		if (!list) { throw new Error('Could not find list') }
		var pos = tags.events.clientPosition(e.originalEvent)
		var tapY = pos.y
		var startTime = new Date().getTime()
		var waitToSeeIfScrollHappened = null
		

		$(list)
			.on(tags.events.move, function onTouchMove($e) {
				if (!tapY) { return }
				var pos = tags.events.clientPosition(e.originalEvent)
				if (Math.abs(pos.y - tapY) > 10) { _clear() }
			})
			.on(tags.events.end, function onTouchEnd($e) {
				clearTimeout(waitToSeeIfScrollHappened)
				if (!el) { return _clear() }
				waitToSeeIfScrollHappened = setTimeout(_doTap, 50)
				function _doTap() {
					var lastScrollEventHappenedSinceRightAroundTouchStart = (tags.__lastScroll__ > startTime - 50)
					if (lastScrollEventHappenedSinceRightAroundTouchStart) { return _clear() } // in this case we want to just stop the scrolling, and not cause an item tap
					$e.preventDefault()
					_selectEl(el)
					_clear()
				}
			})
			.on(tags.events.cancel, function onCancel($e) {
				_clear()
			})
		
		function _clear() {
			$(list).off(tags.events.move).off(tags.events.end)
			_getData(el).opts.toggleActive.call(el, false)
			tapY = null
			el = null
		}
		
		_getData(el).opts.toggleActive.call(el, true)
	})
	
	function _getData(el) {
		var listEl = tags.dom.above(el, 'tags-list')
		var uid = listEl.id
		return Data[uid]
	}
	
	function _selectEl(el) {
		var listEl = tags.dom.above(el, 'tags-list')
		var uid = listEl.id
		var groupEl = tags.dom.above(el, 'tags-list-group')
		var groupId = groupEl.id.replace(uid+'-', '')
		var itemId = el.id.replace(uid+'-', '')
		Data[uid].opts.selectItem.call(el, Data[uid].itemsByGroupId[groupId][itemId])
	}
})
