var Rect = require('std/math/Rect')

var dataMap = { id:0 }

var button = module.exports = function button(data, callback) {
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

$(function() {
	$(document).on('touchstart', '.'+button.className, buttons.onTouchStart)
	$(document).on('mousedown', '.'+button.className, buttons.onMouseDown)
})

var onEnd = function(event, supressHandler) {
	event.preventDefault()
	$el = $(this)
		.off('touchmove').off('touchend').off('touchcancel')
		.off('mouseout').off('mouseover').off('mouseup')
	
	var id = $(this).attr('button-id')
	var map = dataMap[id]
	var callback = isActive($el) && !supressHandler && map.cb
	
	setInactive($el)
	
	if (callback) {
		callback.call(this, event, map.data)
	}
	if (module.exports.globalHandler) {
		module.exports.globalHandler.call(this, event, id)
	}
}

function setActive($el) { $el.addClass('active') }
function setInactive($el) { $el.removeClass('active') }
function isActive($el) { return $el.hasClass('active') }
function setElInactive() { return setInactive($(this)) }
function setElActive() { return setActive($(this)) }

var buttons = {
	onTouchStart: function(event) {
		buttons.init(event, function($el) {
			$el.on('touchmove', buttons.onTouchMove)
			$el.on('touchend', onEnd)
			$el.on('touchcancel', buttons.onTouchCancel)
		})
	},
	onTouchMove: function(event) {
		event.preventDefault()
		var $el = $(this)
		if (touchInsideTapRect($el, event)) { setActive($el) }
		else { setInactive($el) }
	},
	onTouchCancel: function(event) {
		onEnd.call(this, event, true)
	},
	onMouseDown: function(handler, e) {
		buttons.init(event, function($el) {
			$el.on('mouseout', setElInactive)
			$el.on('mouseover', setElActive)
			var el = this, handler
			$(document).on('mouseup', handler=function(event) {
				onEnd.call(el, event)
				$(document).off('mouseup', handler)
			})
		})
	},
	init:function(event, cb) {
		var $el = $(event.target)
		if ($el.hasClass('disabled')) { return }
		
		event.preventDefault()
		
		var offset = $el.offset()
		$el.data('touchRect', new Rect(offset.left, offset.top, $el.width(), $el.height()).pad(22))
		
		setActive($el)
		cb.call(event.target, $el)
	}
}

var touchInsideTapRect = function($el, event) {
	var touch = event.originalEvent.touches[0]
	var touchRect = $el.data('touchRect')
	return touchRect.containsPoint({ x:touch.pageX, y:touch.pageY })
}
