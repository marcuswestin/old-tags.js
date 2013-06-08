var tags = require('tags/tags')
var style = tags.style
module.exports = makeColumnList

var div = tags('div')

function makeColumnList(opts) {
	var opts = tags.options(opts, {
		items:[],
		width:300,
		columnCount:2,
		columnGap:2,
		renderItem:null,
		selectItem:null,
		getItemId:tags.uid,
		toggleActive:function(){}
	})
	
	var id = tags.uid()
	var colCount = opts.columnCount
	var colGap = opts.columnGap
	var colWidth = Math.floor((opts.width - colGap*(colCount - 1)) / colCount)
	var itemsById = {}
	var heights
	
	return {
		toTag:renderColumnList,
		append:append,
		remove:remove
	}

	function remove(item) {
		var itemId = opts.getItemId(item)
		delete itemsById[itemId]
		$('#'+id + ' .tags-columnList-item[itemId="'+itemId+'"]').remove()
	}
	
	function append(items) {
		if (!items) { return }
		if (!$.isArray(items)) { items = [items] }
		if (!items.length) { return }
		$('#'+id+' .tags-columnList-container').append(dangerouslyInnerHtml(renderItems(items)))
	}

	function renderColumnList() {
		nextTick(registerHandlers)
		return div('tags-columnList', attr({ id:id }), style({ width:opts.width }),
			div('tags-columnList-container',
				style({ width:opts.width, position:'absolute' }),
				dangerouslyInnerHtml(renderItems(opts.items))
			)
		)
	}
	
	function renderItems(items) {
		nextTick(layout)
		return map(items, function(item) {
			var itemId = opts.getItemId(item)
			if (itemsById[itemId]) { return '' }
			itemsById[itemId] = item
			return div('tags-columnList-item', { itemId:itemId }, style({ position:'absolute', top:-999999, left:-999999, width:colWidth }),
				opts.renderItem(item)
			)
		}).join('')
	}

	function layoutEl(i, el) {
		var colNum = minHeightNum()
		el.style.top = el.style.left = 0
		el.style['-webkit-transform'] = 'translate3d('+(colNum * (colWidth + colGap))+'px, '+(heights[colNum] + colGap)+'px, 0)'
		heights[colNum] += el.offsetHeight
	}
	
	function layout() {
		heights = array(colCount, function() { return 0 })
		$('#'+id+' .tags-columnList-item').each(layoutEl)
		$('#'+id).css({ height:totalHeight() })
	}
	
	function minHeightNum() {
		for (var i=0, minNum=0; i<heights.length; i++) {
			if (heights[i] < heights[minNum]) { minNum = i }
		}
		return minNum
	}
	
	function totalHeight() {
		for (var i=0, maxNum=0; i<heights.length; i++) {
			if (heights[i] > heights[maxNum]) { maxNum = i }
		}
		return heights[maxNum]
	}
	
	function registerHandlers() {
		if (tags.isTouch) {
			var x
			var y
			var maxDeltaSq = 10 * 10
			
			$('#'+id).on('touchstart', '.tags-columnList-item', function(event) {
				if (event.originalEvent.touches.length != 1) { return }
				var touch = event.originalEvent.touches[0]
				x = touch.pageX
				y = touch.pageY
				$(this).on('touchmove', onTouchMove)
				$(this).on('touchend', onTouchEnd)
				opts.toggleActive(this, true)
			})
			
			function onTouchMove(event) {
				if (event.originalEvent.touches.length != 1) { return }
				var touch = event.originalEvent.touches[0]
				var deltaX = Math.abs(x - touch.pageX)
				var deltaY = Math.abs(y - touch.pageY)
				if (deltaX * deltaX + deltaY * deltaY > maxDeltaSq) {
					onEnd(this, false)
				}
			}
			
			function onTouchEnd(event) {
				onEnd(this, true)
			}
			
			function onEnd(el, doSelect) {
				opts.toggleActive(el, false)
				$(el).off('touchmove', onTouchMove).off('touchend', onTouchEnd)
				if (doSelect) { selectEl(el) }
			}
		} else {
			$('#'+id).on('click', '.tags-columnList-item', function() {
				selectEl(this)
			})
		}
		
		function selectEl(el) {
			opts.selectItem(itemsById[el.getAttribute('itemId')])
		}
	}
	
}
