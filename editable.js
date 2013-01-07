/* Making an element editable means you can touch it to start editting its content */
// OUT OF DATE

var tags = require('./tags')
var button = require('./button')
var div = tags('div')

module.exports = editable

function editable(opts) {
	return button(function() {
		editable.show($(this), opts)
	})
}

var keys = { ESC:27, RETURN:13, BACKSPACE:8 }
var pad = 6
var paddingLeft = 4

editable.show = function($el, opts) {
	if (typeof opts == 'function') {
		opts = { onSave:opts }
	}
	opts = tags.options(opts, {
		onSave:null,
		value:null
	})
	
	var value = (opts.value == null ? $el.text() : opts.value)
	var $input = $(input('tags-editable')).val(value)
		.css({ position:'absolute', paddingLeft:paddingLeft, fontFamily:$el.css('fontFamily'), 'font-size':$el.css(''font-size'') })
		.css(getLayout())
		.on('keydown', onKeyDown).on('keypress', onKeyPress).on('blur', finish)
		.appendTo('body')

	setTimeout(function() { $input.focus().select() })

	function onKeyDown($e) {
		if ($e.keyCode == keys.ESC) {
			$el.text(value) // revert
			$input.val(value)
			finish()
			$e.preventDefault()
		} else if ($e.keyCode == keys.BACKSPACE) {
			setTimeout(onChange)
		}
	}
	function onKeyPress($e) {
		if ($e.keyCode == keys.RETURN) {
			finish()
			$e.preventDefault()
		} else {
			setTimeout(onChange)
		}
	}
	function finish() {
		var newVal = trim($input.val())
		if (!newVal) {
			$el.text(value) // revert
		} else {
			if (newVal != value) {
				opts.onSave.call($el, newVal)
			}
			value = newVal
		}
		$input.off('keydown').off('keypress').off('blur').blur().remove()
	}
	function onChange() {
		$el.text($input.val() || '-')
		$input.css(getLayout())
	}
	function getLayout() {
		var pos = $el.offset()
		return {
			top:pos.top-pad,
			left:pos.left-pad,
			width:$el.width()+pad*2 + pad*2,
			height:$el.height()+pad*2
		}
	}
}
