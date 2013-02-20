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

$(function() {
	$(document).on(tags.events.start, '.tags-draggable', onDragStart)
})

var isDragging = false
function onDragStart($e) {
	$e.preventDefault()
	
	if (isDragging) { return }
	
	var el = this
	var $el = $(el)
	var elOffset = $el.offset()
	var opts = data[$el.attr('tags-draggable-id')]
	
	var history = []
	var pagePos0 = tags.eventPos($e)
	var pos0 = tags.makePos(pagePos0.x - elOffset.left, pagePos0.y - elOffset.top)
	var thresholdSquared = opts.threshold * opts.threshold // removes need for the Math.sqrt to calculate distance
	
	$(document)
		.on(tags.events.move, onMove)
		.on(tags.events.end, onEnd)
		.on(tags.events.cancel, onCancel)
	
	opts.down.call(el)
	
	if (!opts.threshold) {
		onStart($e)
	}
	
	function posForEvent($e) {
		var pagePos = tags.eventPos($e)
		var pos = tags.makePos(pagePos.x - elOffset.left, pagePos.y - elOffset.top)
		var penUltPos = history[history.length - 1]
		if (penUltPos) {
			pos.change = tags.makePos(penUltPos.x, pos.y - penUltPos.y)
		} else {
			pos.change = tags.makePos(0,0)
		}
		pos.distance = tags.makePos(pos.x-pos0.x, pos.y-pos0.y)
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
			var dx = pos.distance.x
			var dy = pos.distance.y
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
			opts.tap.call(el, posForEvent($e))
		}
		cleanUp()
	}
	
	function cleanUp() {
		$(document)
			.off(tags.events.move, onMove)
			.off(tags.events.end, onEnd)
			.off(tags.events.cancel, onCancel)
		
		isDragging = false
		history = null
		
		opts.up.call(el)
	}
}
