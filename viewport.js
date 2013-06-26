var tags = require('./tags')

var viewport = module.exports = {
	fit:fit,
	fitWidth:fitWidth,
	width:width,
	height:height,
	react:react,
	pos:pos,
	el:document.body,
	onResize:onResize
}

var navBarHeight = tags.isIOSSafari ? 60 : 0
var $win = $(window)
var callbacks = []
$win.resize(_handleResize)
_handleResize()
function _handleResize() {
	viewport.size = getSize()
	for (var i=0; i<callbacks.length; i++) {
		callbacks[i] && callbacks[i](viewport.size)
	}
}

function onResize(callback) { callbacks.push(callback) }
function react(callback) {
	callback(getSize())
	onResize(callback)
}

function fit($el) {
	$win.resize(_resizeEl)
	_resizeEl()
	function _resizeEl() {
		$el.css({ width:viewport.size[W], height:viewport.height[H] })
	}
}

function fitWidth($el) {
	function resize() { $el.width(viewport.width()) }
	$win.resize(resize)
	resize()
}

function height() { return $win.height() + navBarHeight }
function width() { return $win.width() }
function getSize() { return [viewport.width(), viewport.height()] }
function pos() { return tags.makePos(0,0) }

viewport.fakeIPhone = function() { viewport.fake(320, 480) }
viewport.fakeIPad = function() { viewport.fake(786, 1024) }
viewport.fake = function(width, height) {
	viewport.width = function() { return width }
	viewport.height = function() { return height }
	_handleResize()
}
