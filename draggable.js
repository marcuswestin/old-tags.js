var tags = require('./tags')

var data = {}
module.exports = function draggable(opts) {
	opts = tags.options(opts, {
		down:function(){},
		up:function(){},
		start:function(pos, history) {},
		move:function(pos, history) {},
		cancel:null,
		end:function(pos, history) {},
		tap:function() {},
		threshold:0
	})

	var id = tags.id()
	data[id] = opts
	return { 'tags-draggable-id':id, 'class':'tags-draggable' }
}

var dragEvents = {
	start: tags.isTouch ? 'touchstart' : 'mousedown',
	move: tags.isTouch ? 'touchmove' : 'mousemove',
	cancel: tags.isTouch ? 'touchcancel' : 'mousecancel',
	end: tags.isTouch ? 'touchend' : 'mouseup'
}

$(function() {
	$(document).on(dragEvents.start, '.tags-draggable', onDragStart)
})

var isDragging = false
function onDragStart($e) {
	$e.preventDefault()
	
	if (isDragging) { return }
	
	var el = this
	var $el = $(el)
	var opts = data[$el.attr('tags-draggable-id')]
	
	var history = []
	var pos0 = tags.eventPos($e)
	var thresholdSquared = opts.threshold * opts.threshold // removes need for the Math.sqrt to calculate distance
	
	$(document)
		.on(dragEvents.move, onMove)
		.on(dragEvents.end, onEnd)
		.on(dragEvents.cancel, onCancel)
	
	opts.down.call(el)
	
	if (!opts.threshold) {
		onStart($e)
	}

	function posForEvent($e) {
		var pos = tags.eventPos($e)
		var penUltPos = history[history.length - 1]
		if (penUltPos) {
			pos.change = { x:pos.x - penUltPos.x, y:pos.y - penUltPos.y }
		} else {
			pos.change = { x:0, y:0 }
		}
		pos.distance = { x:pos.x-pos0.x, y:pos.y-pos0.y }
		history.push(pos)
		return pos
	}

	function onStart($e) {
		isDragging = true
		opts.start.call(el, posForEvent($e), history)
	}

	function onMove($e) {
		var pos = posForEvent($e)
		if (!isDragging) {
			var dx = pos.distance.x, dy = pos.distance.y
			var abSquared = dx*dx + dy*dy
			if (abSquared < thresholdSquared) {
				return // not yet dragging
			}
			onStart($e)
		}
		opts.move.call(el, pos, history)
	}

	function onCancel($e) {
		if (!isDragging) { return }
		if (opts.cancel) {
			opts.cancel.call(el, posForEvent($e), history)
		} else {
			opts.end.call(el, posForEvent($e), history)
		}
		cleanUp()
	}

	function onEnd($e) {
		if (isDragging && history.length > 1) {
			opts.end.call(el, posForEvent($e), history)
		} else {
			opts.tap.call(el)
		}
		cleanUp()
	}
	
	function cleanUp() {
		$(document)
			.off(dragEvents.move, onMove)
			.off(dragEvents.end, onEnd)
			.off(dragEvents.cancel, onCancel)
		
		isDragging = false
		history = null
		
		opts.up.call(el)
	}
}
