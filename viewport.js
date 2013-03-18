var viewport = module.exports = {
	fit:fit,
	fitWidth:fitWidth,
	getSize:getSize,
	size:getSize,
	width:width,
	height:height,
	react:react,
	pos:pos,
	element:document.body
}

function react(callback) {
	callback(getSize())
	callbacks.push(callback)
}

function fit($el) {
	function resize() { $el.css(viewport.getSize()) }
	$win.resize(resize)
	resize()
}

function fitWidth($el) {
	function resize() { $el.width(viewport.width()) }
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