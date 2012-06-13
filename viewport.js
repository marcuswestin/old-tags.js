var viewport = tags.viewport = {
	fit:fit,
	getSize:getSize,
	size:getSize,
	width:width,
	height:height,
	react:react,
	center:center
}

function fit($el) {
	var $el = $el || $(this)
	var resize = function() {
		$el.height(viewport.height()).width(viewport.width())
	}
	$win.resize(resize)
	resize()
}

function center(opts) {
	opts = options(opts, { width:400, height:247 })
	function get(val) {
		return typeof val == 'function' ? val() : val
	}
	return function($tag) {
		$tag.css({ position:'absolute' })
		function resize() {
			var viewSize = viewport.getSize()
			var boxSize = { width:get(opts.width), height:get(opts.height) }
			$tag.css({
				top:viewSize.height / 2 - boxSize.height / 2, left:viewSize.width / 2 - boxSize.width / 2,
				width:boxSize.width, height:boxSize.height
			})
		}
		viewport.react(resize)
		setTimeout(resize)
	}
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