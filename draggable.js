var tags = require('./tags')

module.exports = function draggable(opts) {
	return function($el) {
		makeDraggable($el, opts)
	}
}

var dragEvents = {
	start: tags.isTouch ? 'touchstart' : 'mousedown',
	move: tags.isTouch ? 'touchmove' : 'mousemove',
	end: tags.isTouch ? 'touchend' : 'mouseup'
}

function posWithDistance($e, pos0) {
	var pos = tags.eventPos($e)
	pos.dx = pos.x - pos0.x
	pos.dy = pos.y - pos0.y
	return pos
}

function makeDraggable($el, opts) {
	opts = tags.options(opts, {
		start:function(pos) {},
		move:function(pos) {},
		end:function(pos) {},
		tap:function() {},
		threshold:3
	})
	var thresholdSquared = opts.threshold * opts.threshold // removes need for the Math.sqrt to calculate distance
	$el.on(dragEvents.start, function onDragStart($e) {
		$e.preventDefault()
		var pos0 = tags.eventPos($e)
		var isDragging = false
		$(document)
			.on(dragEvents.move, onMove)
			.on(dragEvents.end, onEnd)
		
		if (!opts.threshold) {
			onStart($e)
		}

		function onStart($e) {
			isDragging = true
			opts.start.call($el, posWithDistance($e, pos0))
		}

		function onMove($e) {
			var pos = posWithDistance($e, pos0)
			if (!isDragging) {
				var abSquared = pos.dx*pos.dx + pos.dy*pos.dy
				if (abSquared < thresholdSquared) {
					return // not yet dragging
				}
				onStart($e)
			}
			opts.move.call($el, posWithDistance($e, pos0))
		}

		function onEnd($e) {
			$(document)
				.off(dragEvents.move, onMove)
				.off(dragEvents.end, onEnd)
			if (isDragging) {
				opts.end.call($el, posWithDistance($e, pos0))
			} else {
				opts.tap.call($el)
			}
		}
	})
}
