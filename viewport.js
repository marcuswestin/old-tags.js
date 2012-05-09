module.exports = {
	fit:fit,
	getSize:getSize,
	width:width,
	height:height
}

function fit() {
	var el = this
	var resize = function() {
		$(el).height(viewport.height()).width(viewport.width())
	}
	$win.resize(resize)
	resize()
}
	
function height() { return $win.height() }
function width() { return $win.width() }
function getSize() { return { width:width(), height:height() } }

var $win = $(window)
