module.exports = textWidth

function textWidth(text, fontSize) {
	if (!textWidth.$el) {
		textWidth.$el = $(document.createElement('span')).css({ position:'absolute', visibility:'hidden', height:'auto', width:'auto' })
	}
	textWidth.$el.css({ fontSize:fontSize }).text(text).appendTo(document.body)
	var width = textWidth.$el.width()
	textWidth.$el.remove()
	return width
}


textWidth.ofInput = function inputTextWidth($input) {
	$input = $($input)
	return textWidth($input.val(), parseInt($input.css('fontSize')))
}
