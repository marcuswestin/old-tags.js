var tags = require('./tags')

var X = tags.X
var Y = tags.Y

var Data = {}

module.exports = function draggable(opts) {
	opts = tags.options(opts, {
		bubble:false,
		down:function(){},
		up:function(){},
		start:function(pos, history) {},
		move:function(pos, history) {},
		cancel:null,
		end:function(pos, history) {},
		tap:function() {},
		threshold:0
	})

	var uid = tags.uid()
	Data[uid] = opts
	return [attr({ 'tags-draggable-uid':uid }), tags.classes('tags-draggable'), tags.destructible(destroyDraggable)]
}

$(function() {
	$(document).on(tags.events.start, '.tags-draggable', onStartEvent)
})

function destroyDraggable() {
	var uid = this.getAttribute('tags-draggable-uid')
	delete Data[uid]
}

var isDragging = false
function onStartEvent($e) {
	if (isDragging) { return }
	
	var el = this
	var $el = $(el)
	var elOffset = $el.offset()
	var opts = Data[$el.attr('tags-draggable-uid')]
	
	if (!opts.bubble) { $e.preventDefault() }
	
	var history = []
	var pagePos0 = tags.eventPos($e)
	var pos0 = tags.makePos(pagePos0[X] - elOffset.left, pagePos0[Y] - elOffset.top)
	var thresholdSquared = opts.threshold * opts.threshold // removes need for the Math.sqrt to calculate distance
	
	$(document)
		.on(tags.events.move, onMove)
		.on(tags.events.end, onEnd)
		.on(tags.events.cancel, onCancel)
	
	opts.down.call(el)
	
	if (!opts.threshold) {
		onStart($e)
	}
	
	function posForEvent($e, changeDelta) {
		var pagePos = tags.eventPos($e)
		var pos = tags.makePos(pagePos[X] - elOffset.left, pagePos[Y] - elOffset.top)
		var penUltPos = history[history.length - (changeDelta || 2)]
		if (penUltPos) {
			pos.change = tags.makePos(pos[X] - penUltPos[X], pos[Y] - penUltPos[Y])
		} else {
			pos.change = tags.makePos(0,0)
		}
		pos.distance = tags.makePos(pos[X]-pos0[X], pos[Y]-pos0[Y])
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
			var dx = pos.distance[X]
			var dy = pos.distance[Y]
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
			opts.cancel.call(el, posForEvent($e, 2), history)
		} else {
			opts.end.call(el, posForEvent($e, 2), history)
		}
		cleanUp()
	}

	function onEnd($e) {
		if (isDragging && history.length > 2) {
			opts.end.call(el, posForEvent($e, 2), history)
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
