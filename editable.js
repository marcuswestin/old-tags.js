;(function() {
	var keys = { ESC:27, RETURN:13, BACKSPACE:8 }
	var pad = 6
	var paddingLeft = 4
	var options = tags.options
	var defaults = {
		onSave:null,
		value:null
	}

	tags.editable = function(className, text, opts) {
		if (typeof opts == 'function') { opts = { onSave:opts } }
		opts = options(opts, defaults)
		
		return link(tags.editable.className+' '+className, text, function() {
			opts.value = $(this).text()
			editable.show(this, opts)
		})
	}

	tags.editable.className = 'editable'

	tags.editable.show = function(el, opts) {
		opts = options(opts, defaults)
		var $el = $(el)
		var value = (opts.value == null ? $el.text() : opts.value)
		var $input = $(input()).val(value)
			.css({ position:'absolute', paddingLeft:paddingLeft, fontFamily:$el.css('fontFamily'), fontSize:$el.css('fontSize') })
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
			$el.text($input.val())
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

	tags.editable.toggle = function(className, isTrue, value1, value2, onSave) {
		return link(tags.editable.className + ' '+className, isTrue ? value1 : value2, function() {
			$(this).text(isTrue ? value2 : value1)
			isTrue = !isTrue
			onSave(isTrue)
		})
	}

	tags.editable.checkbox = function(className, isChecked, onChange) {
		return $(input(tags.editable.className + ' ' + className, { type:'checkbox' }, function() {
			this.checked = isChecked
		})).on('change', function() {
			onChange(this.checked)
		})
	}	
}())
