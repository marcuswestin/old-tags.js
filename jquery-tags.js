// Make tags.js work with jQuery
var tags = require('./tags')

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
			if (args[i].toHtml) {
				if (!tags.isSafeToHtml(args[i].toHtml)) { continue }
				args[i] = $(args[i].toHtml())
			} else if (args[i].toTag) {
				if (!tags.isSafeToTag(args[i].toTag)) { continue }
				args[i] = processJqueryArgs(args[i].toTag())
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
		} else if (arg.toHtml) {
			if (!tags.isSafeToHtml(arg.toHtml)) { return }
			originalJqFn.call(this, $(arg.toHtml()))
		} else if (arg.toTag) {
			if (!tags.isSafeToTag(arg.toTag)) { return }
			originalJqFn.call(this, arg.toTag())
		} else {
			originalJqFn.call(this, arg)
		}
	}
}(jQuery))
