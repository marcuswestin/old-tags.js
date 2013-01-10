var tags = require('./tags')

module.exports = button

var buttons = {}
function button(opts) {
	if (typeof opts == 'function') {
		opts = { tap:opts }
	}
	opts = tags.options(opts, {
		start:function() {},
		tap:function() {},
		end:function() {}
	})
	var id = tags.id()
	buttons[id] = opts
	return { 'button-id':id, 'class':'tags-button' }
}

function makeRect(x, y, width, height) {
	return tags.create(rectProto).init(x, y, width, height)
}

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

var onEnd = function(event, $el, supressHandler) {
	event.preventDefault()
	
	if (tags.isTouch) {
		$el.off('touchmove').off('touchend').off('touchcancel')
	} else {
		$el.off('mouseout').off('mouseover').off('mouseup')
	}
	
	var doCallTap = isActive($el) && !supressHandler

	setInactive($el)

	var button = buttons[$el.attr('button-id')]
	if (button) { button.tap.call($el[0], event) }
	button.end.call($el[0])
}

function setActive($el) { $el.addClass('active') }
function setInactive($el) { $el.removeClass('active') }
function isActive($el) { return $el.hasClass('active') }

function onTouchStart(event) {
	initButton(event, function($el) {
		$el.on('touchmove', function(event) { onTouchMove(event, $el) })
		$el.on('touchend', function(event) { onEnd(event, $el) })
		$el.on('touchcancel', function(event) { onTouchCancel(event, $el) })
	})
}

function onTouchMove(event, $el) {
	event.preventDefault()
	if (touchInsideTapRect($el, event)) { setActive($el) }
	else { setInactive($el) }
}

function onTouchCancel(event, $el) {
	onEnd(event, $el, true)
}

function onMouseDown(event) {
	initButton(event, function($el) {
		$el.on('mouseout', function() { setInactive($el) })
		$el.on('mouseover', function() { setActive($el) })
		var handler
		$(document).on('mouseup', handler=function(event) {
			onEnd(event, $el)
			$(document).off('mouseup', handler)
		})
	})
}

function initButton(event, cb) {
	var $el = $(event.currentTarget) //$(event.target)
	
	var button = buttons[$el.attr('button-id')]
	button.start.call($el[0])
	
	if ($el.hasClass('disabled')) { return }
	
	event.preventDefault()
	
	var offset = $el.offset()
	var touchRect = makeRect(offset.left, offset.top, $el.width(), $el.height()).pad(20, 28, 30, 20)
	$el.data('touchRect', touchRect)
	
	setActive($el)
	cb($el)
}
var touchInsideTapRect = function($el, event) {
	var touch = event.originalEvent.touches[0]
	var touchRect = $el.data('touchRect')
	return touchRect && touchRect.containsPoint({ x:touch.pageX, y:touch.pageY })
}

$(function() {
	if (tags.isTouch) {
		$(document).on('touchstart', '.tags-button', onTouchStart)
	} else {
		$(document).on('mousedown', '.tags-button', onMouseDown)
	}
})
