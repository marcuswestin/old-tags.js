module.exports = makeTableView

var makeScrollView = require('./makeScrollView')

function makeTableView(opts) {
	opts = options(opts, {
		viewSize:null,
		rowHeight:null,
		numRows:null,
		renderRowInElement:null
	})
	
	var uid = tags.uid()
	var viewSize = opts.viewSize
	var rowHeight = opts.rowHeight
	var count = 0
	var extra = viewSize[H]
	var numRows = opts.numRows

	var stickies = []
	var currentStickyIndex = -1
	
	var bounds = [
		{ y:0, rowIndex:0 },
		{ y:0, rowIndex:0 }
	]
	
	var scrollView = makeScrollView({
		scrollX:false,
		scrollY:true,
		viewSize:viewSize,
		contentSize:[viewSize[W], numRows * rowHeight],
		onScroll:_onScroll
	})
	
	nextTick(_init)
	
	return setProps(div('tags-tableView', attr({ id:uid }), scrollView), {
		makeSticky:makeSticky
	})
	
	function makeSticky(el, info) {
		el.style.zIndex = 1
		stickies.push({ el: el, y: info.y, naturalY: info.y, height:rowHeight })
	}
	
	function _init() {
		_extendTop()
		_extendBottom()
	}
	
	function _extendTop() {
		var targetY = clip(scrollView.scroll[Y] - extra, 0)
		if (bounds[TOP].y <= targetY) { return }
		var frag = document.createDocumentFragment()
		while (bounds[TOP].y > targetY) {
			frag.appendChild(_renderRow(bounds[TOP]))
			bounds[TOP].y -= rowHeight
			bounds[TOP].rowIndex -= 1
		}
		scrollView.content.append(frag)
	}
	
	function _extendBottom() {
		var targetY = clip(scrollView.scroll[Y] + viewSize[H] + extra, 0, numRows * rowHeight)
		if (bounds[BOTTOM].y >= targetY) { return }
		var frag = document.createDocumentFragment()
		while (bounds[BOTTOM].y < targetY) {
			frag.appendChild(_renderRow(bounds[BOTTOM]))
			bounds[BOTTOM].y += rowHeight
			bounds[BOTTOM].rowIndex += 1
		}
		scrollView.content.append(frag)
	}
	
	function _onScroll(info) {
		// _updateSticky(scrollView, info)
		
		if (info.change[Y] < 0) {
			_extendTop()
		} else if (info.change[Y] > 0) {
			_extendBottom()
		}
	}
	
	function _renderRow(bound) {
		var el = document.createElement('div')
		el.style.width = viewSize[W]+'px'
		el.style.height = rowHeight+'px'
		el.style.overflow = 'hidden'
		el.style.position = 'absolute'
		el.style.top = 0+'px'
		el.style.webkitTransform = 'translate3d(0,'+bound.y+'px,0)'
		opts.renderRowInElement(el, bound)
		return el
	}
	
	
	
	function _getStickies() {
		return {
			prev: stickies[currentStickyIndex - 1],
			curr: stickies[currentStickyIndex],
			next: stickies[currentStickyIndex + 1]
		}
	}
	function _positionSticky(sticky, y) {
		sticky.el.style.webkitTransform = 'translate3d(0,'+(y)+'px,0)'
		sticky.y = y
	}
	function _updateStickies(upOrDown) {
		var currentSticky = stickies[currentStickyIndex]
		if (currentSticky) {
			currentSticky.el.style.boxShadow = 'none'
		}
		currentStickyIndex += upOrDown
		currentSticky = stickies[currentStickyIndex]
		if (currentSticky) {
			if (!client.isIPhone) {
				// currentSticky.el.style.boxShadow = '0 1px 1px rgba(0,0,0,.5)'				
			}
		}
		return _getStickies()
	}
	
	function _updateSticky(scrollView, info) {
		if (currentStickyIndex == null) { return };
		
		var stickyLine = Math.floor(scrollView.visualScroll[Y])
		
		var stickies = _getStickies()
		
		var previousStickyTop = (stickies.prev ? stickies.prev.y : -Infinity)
		var currentStickyBottom = (stickies.curr ? stickies.curr.y + stickies.curr.height : stickyLine)
		var nextStickyTop = (stickies.next ? stickies.next.naturalY : Infinity)
		
		if (previousStickyTop > stickyLine) {
			if (stickies.curr) {
				_positionSticky(stickies.curr, stickies.curr.naturalY)				
			}
			stickies = _updateStickies(-1)
		} else if (nextStickyTop < currentStickyBottom) {
			if (stickies.curr) {
				_positionSticky(stickies.curr, nextStickyTop - stickies.curr.height)
			}
			stickies = _updateStickies(1)
		}
		
		if (stickies.curr) {
			_positionSticky(stickies.curr, Math.max(stickyLine, stickies.curr.naturalY))
		}
	}

}
