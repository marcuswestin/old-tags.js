var tags = require('./tags')
var options = require('std/options')
var extend = require('std/extend')

module.exports = makeList

function defaultGroupBy() { return 1 }
function defaultRenderGroupHead() { return '' }
function defaultUpdateGroupHead() {}

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

	if (!uid) {
		throw new Error('makeList with caching requires cache.uid to be set')
	}

	if (!opts.updateItem) {
		opts.updateItem = opts.renderItem
	}
	
	nextTick(_setupEvents)
	
	/* List instance API
	 *******************/
	return extend(div(attr({ id:uid }), opts.renderEmpty()),
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
		$('#'+uid).off('touchstart').off('touchmove').off('touchend').off('click').off('mouseover').off('mouseout').empty()
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
	
	function _setupEvents() {
		var $list = $('#'+uid)
		var targetClass = '.tags-list-item'
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
		
		function _selectEl(el) {
			var groupEl = el.parentNode
			while (!$(groupEl).hasClass('tags-list-group')) { groupEl = groupEl.parentNode }
			var idForGroup = groupEl.id.replace(uid+'-', '')
			var idForItem = el.id.replace(uid+'-', '')
			var item = itemsByGroupId[idForGroup][idForItem]
			opts.selectItem.call(el, item)
		}
	}
}
