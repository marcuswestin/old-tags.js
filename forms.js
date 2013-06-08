// OUT OF DATE

var tags = require('tags')
var input = tags('input')
var div = tags('div')
var label = tags('label')

module.exports = {
	field:field,
	checkbox:checkbox,
	select:select,
	submission:submission
}

function field(id, labelText, opts) {
	var fieldOpts = options(opts, { input:input })
	if (!opts) { opts = {} }
	if (!opts.id) { opts.id = id }
	return div('tags-forms-field',
		label(attr({ 'for':id }), labelText),
		fieldOpts.input(null, opts)
	)
}

function checkbox(className, opts) {
	if (typeof className == 'object' && !opts) {
		opts = className
		className = null
	}
	opts = tags.options(opts, {
		id: null,
		value: false,
		disabled: false,
		onChange: null
	})
	var $input = $(input('tags-forms-checkbox ' + (className || '')), attr({ type:'checkbox', id:id }), function() {
		this.checked = opts.value
	}))
	if (opts.onChange) {
		$input.on('change', function() {
			opts.onChange.call(this, this.checked)
		})
	}
	return $input
}

function select(className, opts) {// name, selectOptions, opts) {
	if (typeof className == 'objects' && !opts) {
		opts = className
		className = null
	}
	opts = tags.options(opts, {
		options:['Example value 1', { value:'ex2', label:'Example value 2' }],
		value:null,
		id:null,
		disabled: false,
		onChange:null
	})
	var selectOptions = opts.options
	var attrsHtml = (opts.id ? ' id="'+opts.id+'" name="'+opts.id+'"' : '')
	var $select = $('<select class="'+tags.classNames('tags-forms-select ' + (className || ''))+'" '+attrsHtml+'>'+$.map(selectOptions, function(option) {
		var selected = ((opts.value && opts.value == (option.value ? option.value : option)) ? 'selected=true' : '')
		var value = option.value ? option.value : option
		var label = option.label ? option.label : option
		return '<option value="'+value+'" '+selected+'>'+label+'</option>'
	}).join('')+'</select>')
	if (opts.onChange) {
		$select.on('change', function($e) {
			opts.onChange.call(this, $select.val())
		})
	}
	return $select
}

function submission(text, submittingText, opts, onsubmit) {
	if (!onsubmit && typeof opts == 'function') {
		onsubmit = opts
		opts = null
	}
	var form, submit
	return [div('tags-forms-submission', text, button(function() {
		$(form).submit()
	}), function() {
		// Allow for the node to be appended to the form before climbind the dom tree
		form = this
		submit = this
		setTimeout(function() {
			while (form.tagName != 'FORM') {
				form = form.parentNode
			}
			var disableAll = function(disabled) {
				if (disabled) {
					var $inputs = $(form).find('input')
					for (var i=0, input; input = $inputs[i]; i++) {
						var $input = $(input)
						$input.attr('__wasDisabled', $input.prop('disabled'))
						$input.prop('disabled', true).addClass('disabled')
					}
					$(form).find('.tags-forms-submission').text(submittingText).addClass('disabled')
				} else {
					var $inputs = $(form).find('input')
					for (var i=0, input; input = $inputs[i]; i++) {
						var $input = $(input)
						if ($input.attr('__wasDisabled') != 'true') {
							$input.prop('disabled', false).removeProp('disabled').removeClass('disabled')
						}
					}
					$(form).find('.tags-forms-submission').text(text).removeClass('disabled')
				}
			}
			$(form).on('submit', function($e) {
				$e.preventDefault()
				disableAll(true)
				onsubmit.call(form, function(err) {
					disableAll(false)
					if (err) { return error(err) }
				})
			})
		}, 0)
	}), input(attr({ type:'submit' }), style({ visibility:'hidden', position:'absolute', top:-999999, left:-999999 }))]
}

