// useful: $(document).on('input', 'input', fitInputText)

var textWidth = require('./textWidth')

module.exports = function fitInputText() {
	var $input = $(this)
	var dataset = this.dataset
	if (!dataset.origFontSize) {
		dataset.origFontSize = $input.css('fontSize')
		dataset.maxTextWidth = $input.width() - (parseInt($input.css('paddingLeft')) || 0) - (parseInt($input.css('paddingRight')) || 0) + 8
	}
	var origFontSize = parseInt(dataset.origFontSize)
	var maxWidth = parseInt(dataset.maxTextWidth)
	var fontSize = parseInt($input.css('fontSize'))
	var text = $input.val()
	while (fontSize < origFontSize && textWidth(text, fontSize) <= maxWidth) {
		fontSize += 1
	}
	while (textWidth(text, fontSize) > maxWidth && fontSize > 1) {
		fontSize -= 1
	}
	$input.css({ fontSize:fontSize })
}
