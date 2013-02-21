var viewport = module.exports = {
	fit:fit,
	getSize:getSize,
	size:getSize,
	width:width,
	height:height,
	react:react,
	pos:pos
}

function react(callback) {
	callback(getSize())
	callbacks.push(callback)
}

function fit($el) {
	var resize = function() {
		$el.height(viewport.height()).width(viewport.width())
	}
	$win.resize(resize)
	resize()
}

function height() { return $win.height() }
function width() { return $win.width() }
function getSize() { return { width:viewport.width(), height:viewport.height() } }
function pos() { return tags.makePos(0,0) }

var $win = $(window)
var callbacks = []

$win.resize(function() {
	var size = getSize()
	for (var i=0; i<callbacks.length; i++) {
		callbacks[i] && callbacks[i](size)
	}
})