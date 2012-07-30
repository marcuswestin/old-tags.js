var rectProto = {
	init: function(x, y, width, height) {
		this.x = x
		this.y = y
		this.x2 = x + width
		this.y2 = y + height
		return this
	},
	pad: function(top, right, bottom, left) {
		this.x -= left
		this.x2 += right
		this.y -= top
		this.y2 += bottom
		return this
	},
	containsPoint: function(point) {
		return this.x < point.x && point.x < this.x2
			&& this.y < point.y && point.y < this.y2
	}
}

function makeRect(x, y, width, height) {
	return tags.create(rectProto).init(x, y, width, height)
}

var dataMap = { id:0 }

var button = tags.button = function button(data, callback) {
	return function() {
		var id = dataMap.id++
		if (callback) {
			dataMap[id] = { data:data, cb:callback }
		} else {
			dataMap[id] = { cb:data }
		}
		$(this).attr('button-id', id).addClass(button.className)
	}
}

button.className = 'dom-buttom'
button.onError = function() {}

var onEnd = function(event, $el, supressHandler) {
	event.preventDefault()
	
	if (tags.isTouch) {
		$el.off('touchmove').off('touchend').off('touchcancel')
	} else {
		$el.off('mouseout').off('mouseover').off('mouseup')
	}
	
	var id = $el.attr('button-id')
	var map = dataMap[id]
	var callback = isActive($el) && !supressHandler && map.cb
	
	setInactive($el)
	
	if (callback) {
		callback.call($el[0], event, map.data)
	}
	if (tags.button.globalHandler) {
		tags.button.globalHandler.call($el[0], event, id)
	}
}

function setActive($el) { $el.addClass('active') }
function setInactive($el) { $el.removeClass('active') }
function isActive($el) { return $el.hasClass('active') }

var buttons = {
	onTouchStart: function(event) {
		buttons.init(event, function($el) {
			$el.on('touchmove', function(event) { buttons.onTouchMove(event, $el) })
			$el.on('touchend', function(event) { onEnd(event, $el) })
			$el.on('touchcancel', function(event) { buttons.onTouchCancel(event, $el) })
		})
	},
	onTouchMove: function(event, $el) {
		event.preventDefault()
		if (touchInsideTapRect($el, event)) { setActive($el) }
		else { setInactive($el) }
	},
	onTouchCancel: function(event, $el) {
		onEnd(event, $el, true)
	},
	onMouseDown: function(event) {
		buttons.init(event, function($el) {
			$el.on('mouseout', function() { setInactive($el) })
			$el.on('mouseover', function() { setActive($el) })
			var handler
			$(document).on('mouseup', handler=function(event) {
				onEnd(event, $el)
				$(document).off('mouseup', handler)
			})
		})
	},
	init:function(event, cb) {
		var $el = $(event.currentTarget) //$(event.target)
		if ($el.hasClass('disabled')) { return }
		
		event.preventDefault()
		
		var offset = $el.offset()
		var touchRect = makeRect(offset.left, offset.top, $el.width(), $el.height()).pad(31, 15, 35, 15)
		$el.data('touchRect', touchRect)
		
		setActive($el)
		cb.call(event.target, $el)
	}
}

var touchInsideTapRect = function($el, event) {
	var touch = event.originalEvent.touches[0]
	var touchRect = $el.data('touchRect')
	return touchRect && touchRect.containsPoint({ x:touch.pageX, y:touch.pageY })
}

$(function() {
	if (tags.isTouch) {
		$(document).on('touchstart', '.'+button.className, buttons.onTouchStart)
	} else {
		$(document).on('mousedown', '.'+button.className, buttons.onMouseDown)
	}
})
