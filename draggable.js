var tags = require('./tags')

module.exports = function draggable(opts) {
	return function($el) {
		makeDraggable($el, opts)
	}
}

var dragEvents = {
	start: tags.isTouch ? 'touchstart' : 'mousedown',
	move: tags.isTouch ? 'touchmove' : 'mousemove',
	cancel: tags.isTouch ? 'touchcancel' : 'mousecancel',
	end: tags.isTouch ? 'touchend' : 'mouseup'
}

function makeDraggable($el, opts) {
	opts = tags.options(opts, {
		start:function(pos, history) {},
		move:function(pos, history) {},
		cancel:null,
		end:function(pos, history) {},
		tap:function() {},
		threshold:3
	})

	var thresholdSquared = opts.threshold * opts.threshold // removes need for the Math.sqrt to calculate distance
	var isDragging = false

	$el.on(dragEvents.start, function onDragStart($e) {
		$e.preventDefault()
		
		if (isDragging) { return }
		
		var history = []
		var pos0 = tags.eventPos($e)
		
		$(document)
			.on(dragEvents.move, onMove)
			.on(dragEvents.end, onEnd)
			.on(dragEvents.cancel, onCancel)
		
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
			opts.start.call($el, posForEvent($e), history)
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
			opts.move.call($el, pos, history)
		}

		function onCancel($e) {
			if (!isDragging) { return }
			if (opts.cancel) {
				opts.cancel.call($el, posForEvent($e), history)
			} else {
				opts.end.call($el, posForEvent($e), history)
			}
			cleanUp()
		}

		function onEnd($e) {
			if (isDragging) {
				opts.end.call($el, posForEvent($e), history)
			} else {
				opts.tap.call($el)
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
		}
	})
}
