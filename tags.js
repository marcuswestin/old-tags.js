;(function(global) {
	
	var create = (typeof Object.create == 'function'
		? function nativeCreate(protoObj) { return Object.create(protoObj) }
		: function shimCreate(protoObj) { function F(){}; F.prototype = protoObj; return new F() }
	)
	
	var isTouch
	try {
		document.createEvent("TouchEvent")
		isTouch = ('ontouchstart' in window)
	} catch (e) {
		isTouch = false
	}
	
	var tags = {
		create: create,
		isTouch:isTouch,
		createTag: function(tagName, render) {
			return function tagCreator() {
				var instance = tags.create(tagsProto)
				instance.args = Array.prototype.slice.call(arguments)
				instance.tagName = tagName
				if (render) { instance.__render = render }
				return instance
			}
		},
		expose: function(tagNames) {
			if (!tagNames) {
				tagNames = 'div,span,img,a,p,h1,h2,h3,h4,h5,h6,ol,ul,li,iframe,buttom,input,textarea,form,label,br,canvas'
			}
			tagNames = tagNames.split(',')
			for (var i=0, tagName; tagName=tagNames[i]; i++) {
				global[tagName] = tags.createTag(tagName)
			}
			for (var key in tags) {
				if (dontExpose[key] || !tags.hasOwnProperty(key)) { continue }
				global[key] = tags[key]
			}
		}
	}
	
	var dontExpose = {}
	for (var key in tags) { dontExpose[key] = true }
	
	var tagsProto = {
		__isTag:true,
		__render:function renderTag() {
			if (this.el) { return this.el }
			this.el = document.createElement(this.tagName)
			var args = this.args
			var index = 0
			if (typeof args[0] == 'string') {
				this.el.className = args[0]
				index = 1
			}
			this.__processArgs(args, index)
			return this.el
		},
		__processArgs:function processTagArgs(args, index) {
			while (index < args.length) {
				this.__processArg(args[index++])
			}
		},
		__processArg:function processTagArg(arg) {
			if (arg == null) { return } // null & undefined
			var el = this.el
			var type = typeof arg
			if (arg.__isTag) {
				el.appendChild(arg.__render())
			} else if (arg.toTag) {
				this.__processArg(arg.toTag())
			} else if (type == 'string' || type == 'number') {
				el.appendChild(document.createTextNode(arg))
			// http://stackoverflow.com/questions/120262/whats-the-best-way-to-detect-if-a-given-javascript-object-is-a-dom-element
			} else if (arg.nodeType && arg.nodeType == 1) {
				el.appendChild(arg)
			} else if ($.isArray(arg)) {
				this.__processArgs(arg, 0)
			} else if (type == 'function') {
				arg.call(el, $(el))
			} else if (arg.renderTag) {
				this.__processArgs(arg.renderTag($(el)), 0)
			} else if (arg instanceof jQuery) {
				this.__processArgs(arg, 0)
			} else {
				for (var key in arg) {
					if (!arg.hasOwnProperty(key)) { continue }
					el.setAttribute(key, arg[key])
				}
			}
		}
	}
	
	function enableJQueryTags($) {
		function processJqueryArgs(args) {
			if (!args) { return args }
			for (var i=0; i<args.length; i++) {
				if (!args[i]) { continue }
				if (args[i].__isTag) {
					args[i] = args[i].__render()
				} else if ($.isArray(args[i])) {
					args[i] = processJqueryArgs(args[i])
				}
			}
			return args
		}
		
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
	}
	
	if (typeof jQuery != 'undefined') { enableJQueryTags(jQuery) }
	
	global.tags = tags
	
})(this)
