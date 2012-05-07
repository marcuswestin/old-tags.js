;(function(global) {
	
	var create = (typeof Object.create == 'function'
		? function nativeCreate(protoObj) { return Object.create(protoObj) }
		: function shimCreate(protoObj) { function F(){}; F.prototype = protoObj; return new F() }
	)
	
	var tags = {
		create: create,
		createTag: function(tagName, render) {
			return function tagCreator() {
				var instance = tags.create(tagsProto)
				instance.args = Array.prototype.slice.call(arguments)
				instance.tagName = tagName
				if (render) { instance.render = render }
				return instance
			}
		},
		style: function(styles) {
			return { style:styles }
		},
		expose: function() {
			var tagNames = 'div,span,img,a,p,h1,h2,h3,h4,h5,h6,ol,ul,li,iframe,buttom,input,textarea,form,label,br'.split(',')
			for (var i=0, tagName; tagName=tagNames[i]; i++) {
				global[tagName] = tags.createTag(tagName)
			}
			global.raw = tags.createTag('span', function renderRawTag() {
				var container = document.createElement('span')
				container.innerHTML = this.args.join(' ')
				return container
			})
			global.style = tags.style
		}
	}
	
	var tagsProto = {
		__isTag:true,
		render:function renderTag() {
			if (this.el) { return this.el }
			this.el = document.createElement(this.tagName)
			var args = this.args
			var index = 0
			if (typeof args[0] == 'string') {
				this.el.className = args[0]
				index = 1
			}
			this._processArgs(args, index)
			return this.el
		},
		_processArgs:function _processTagArgs(args, index) {
			while (index < args.length) {
				this._processArg(args[index++])
			}
		},
		_processArg:function _processTagArg(arg) {
			if (arg == null) { return } // null & undefined
			var el = this.el
			var type = typeof arg
			if (arg.__isTag) {
				el.appendChild(arg.render())
			} else if (type == 'string' || type == 'number') {
				el.appendChild(document.createTextNode(arg))
			// http://stackoverflow.com/questions/120262/whats-the-best-way-to-detect-if-a-given-javascript-object-is-a-dom-element
			} else if (arg.nodeType && arg.nodeType == 1) {
				el.appendChild(arg)
			} else if ($.isArray(arg)) {
				this._processArgs(arg, 0)
			} else if (type == 'function') {
				arg.call(el, this)
			} else {
				for (var key in arg) {
					if (!arg.hasOwnProperty(key)) { continue }
					var val = arg[key]
					if (key == 'style') {
						for (var styleKey in val) { setStyle(el, styleKey, val[styleKey]) }
					} else {
						el.setAttribute(key, val)
					}
				}
			}
		}
	}
	
	var setStyle = function(el, name, val) {
		if (typeof val == 'number' && name != 'opacity') { val += 'px' }
		else if (name == 'float') { name = 'cssFloat' }
		el.style[name] = val
	}
	
	if (typeof module != 'undefined' && typeof module != 'function') { module.exports = tags }
	else if (typeof define === 'function' && define.amd) { define(tags) }
	else { global.tags = tags }

	function enableJQueryTags() {
		function processJqueryArgs(args) {
			if (!args) { return args }
			for (var i=0; i<args.length; i++) {
				if (args[i] && args[i].__isTag) {
					args[i] = args[i].render()
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
			return originalDomManip.apply(this, arguments)
		}
		$.fn.domManip.prototype = originalDomManip.prototype
	}
	
	if (typeof $ != 'undefined') { enableJQueryTags() }
	
})(this)
