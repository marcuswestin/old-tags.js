var tags = require('./tags')

var viewport = module.exports = {
	fit:fit,
	fitWidth:fitWidth,
	getSize:getSize,
	size:getSize,
	width:width,
	height:height,
	react:react,
	pos:pos,
	el:document.body,
	onResize:onResize
}

var navBarHeight = tags.isIOSSafari ? 60 : 0

function onResize(callback) { callbacks.push(callback) }
function react(callback) {
	callback(getSize())
	onResize(callback)
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

function height() { return $win.height() + navBarHeight }
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

viewport.fakeIPhone = function() { viewport.fake(320, 480) }
viewport.fakeIPad = function() { viewport.fake(786, 1024) }
viewport.fake = function(width, height) {
	viewport.width = function() { return width }
	viewport.height = function() { return height }
}
