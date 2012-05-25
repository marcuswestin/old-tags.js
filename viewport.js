var viewport = tags.viewport = {
	fit:fit,
	getSize:getSize,
	size:getSize,
	width:width,
	height:height,
	react:react
}

function fit($el) {
	var $el = $el || $(this)
	var resize = function() {
		$el.height(viewport.height()).width(viewport.width())
	}
	$win.resize(resize)
	resize()
}

function react(callback) {
	callbacks.push(callback)
	$(callback)
}
	
function height() { return $win.height() }
function width() { return $win.width() }
function getSize() { return { width:width(), height:height() } }

var $win = $(window)
var callbacks = []

$win.resize(function() {
	for (var i=0; i<callbacks.length; i++) {
		callbacks[i] && callbacks[i]()
	}
})