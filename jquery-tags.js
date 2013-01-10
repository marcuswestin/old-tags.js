// Make tags.js work with jQuery

;(function enableJQueryTags($) {
	var originalInit = $.fn.init
	$.fn.init = function() {
		return originalInit.apply(this, processJqueryArgs(arguments))
	}
	$.fn.init.prototype = originalInit.prototype

	var originalDomManip = $.fn.domManip
	$.fn.domManip = function() {
		arguments[0] = processJqueryArgs(arguments[0])
		return originalDomManip.apply(this, processJqueryArgs(arguments))
	}
	$.fn.domManip.prototype = originalDomManip.prototype

	function processJqueryArgs(args) {
		if (!args) { return args }
		for (var i=0; i<args.length; i++) {
			if (!args[i]) { continue }
			if (args[i].__tagHTML) {
				args[i] = $(args[i].__tagHTML)
			} else if (args[i].__renderTag) {
				args[i] = $(args[i].__renderTag())
			} else if ($.isArray(args[i])) {
				args[i] = processJqueryArgs(args[i])
			}
		}
		return args
	}

	var originalAppend = $.fn.append
	$.fn.append = function jqAppendMonkeyPatch() {
		for (var i=0; i<arguments.length; i++) {
			renderTagArgs.call(this, arguments[i], originalAppend)
		}
		return this
	}

	var originalAfter = $.fn.after
	$.fn.after = function jqAfterMonkeyPatch() {
		for (var i=0; i<arguments.length; i++) {
			renderTagArgs.call(this, arguments[i], originalAfter)
		}
		return this
	}

	function renderTagArgs(arg, originalJqFn) {
		if (arg == undefined) {
			return
		} else if ($.isArray(arg)) {
			for (var i=0; i<arg.length; i++) { renderTagArgs.call(this, arg[i], originalJqFn) }
		} else if (arg.__tagHTML) {
			originalJqFn.call(this, $(arg.__tagHTML))
		} else if (arg.__renderTag) {
			originalJqFn.call(this, arg.__renderTag())
		} else {
			originalJqFn.call(this, arg)
		}
	}
}(jQuery))
