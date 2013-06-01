var tags = module.exports = function tags(tagName) {
	return function createTag() {
		var classes = []
		var content = []
		var attributes = []
		var styles = []
		
		if (typeof arguments[0] == 'string') {
			classes.push(arguments[0])
			handleTagArgs(arguments, 1, content, attributes, classes, styles)
		} else {
			handleTagArgs(arguments, 0, content, attributes, classes, styles)
		}
		
		return {
			__renderTag:function() {
				var classesHTML = classes.length ? ' class="'+classes.join(' ')+'" ' : ''
				var stylesHTML = styles.length ? ' style="'+styles.join('; ')+'" ' : ''
				return '<'+tagName+' '+attributes.join(' ')+classesHTML+stylesHTML+'>'+content.join('')+'</'+tagName+'>'
			},
			toHtml:tagsToHtml,
			toString:tagsToHtml,
			appendContent:function(newContent) { content.push(newContent) }
		}
	}
}

tags.warn = function(message) { console.warn('tags.warn:', message) }

function tagsToHtml() { return this.__tagHTML || this.__renderTag() }

var customTagBase = { __customTag:function(ctx) { return this.contentFn.call(ctx).toHtml() } }
tags.toTag = function(contentFn) {
	return tags.extend(tags.create(customTagBase), { contentFn:contentFn })
}

var ua = window.navigator.userAgent
tags.isHandheldSafari = ua.match(/(iPod|iPhone)/) && ua.match(/Safari/)
tags.isIOSSafari = ua.match(/(iPod|iPhone|iPad)/) && ua.match(/Safari/)

tags.br = { __tagHTML:'<br />', toString:tagsToHtml, toHtml:tagsToHtml }
tags.html = function(html) { return { __tagHTML:html, toString:tagsToHtml, toHtml:tagsToHtml } }

tags.isSafeToTag = function(toTag) {
	if (customTagBase.isPrototypeOf(toTag)) { return true };
	tags.warn('Tags encountered a dangerous .toTag()')
	return false
}
tags.isSafeToHtml = function(toHtml) {
	if (toHtml === tagsToHtml) { return true };
	tags.warn('Tags encountered a dangerous .toHtml()')
	return false
}

function handleTagArgs(args, i, content, attributes, classes, styles) {
	for (; i<args.length; i++) {
		handleTagArg(args[i], content, attributes, classes, styles)
	}
}

function handleTagArg(arg, content, attributes, classes, styles) {
	var type = typeof arg
	if (arg == null) {
		// null and undefined - do nothing
	} else if (arg.toHtml) {
		if (!tags.isSafeToHtml(tagsToHtml)) { return }
		content.push(arg.toHtml())
	} else if (arg.toTag) {
		if (!tags.isSafeToTag(arg.toTag)) { return }
		content.push(arg.toTag.__customTag(arg))
	} else if (typeof arg == 'string') {
		content.push(safeHTML(arg))
	} else if (typeof arg == 'number') {
		content.push(arg)
	} else if ($.isArray(arg)) {
		handleTagArgs(arg, 0, content, attributes, classes, styles)
	} else if (typeof arg == 'function') {
		handleTagArg(arg(), content, attributes, classes, styles)
	} else {
		for (var key in arg) {
			var val = arg[key]
			if (key == 'style') {
				if (!style.baseStyle.isPrototypeOf(arg)) { tags.warn('Tags encountered a dangerous style attribute'); continue }
				styles.push(val)
			} else if (key == 'class') {
				classes.push(val)
			} else if (val != null) {
				if (!attributeWhitelistRegex.test(key)) { tags.warn('Tags encountered a non-whitelisted attribute: '+key); continue }
				attributes.push(key+'="'+safeAttr(val)+'"')
			}
		}
	}
}

var attributeWhitelistRegex = /^(id|type|name|src|href|frameborder|tags-\S*|data-\S*)$/i

var safeAttr = (function() {
	var regex = /"/g
	return function(str) {
		return str.toString().replace(regex, '\\"')
	}
}())

var safeHTML = (function() {
	var tagsToReplace = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;'
	}

	function replaceTag(tag) {
		return tagsToReplace[tag] || tag;
	}

	var regex = /[&<>]/g
	return function safeHTML(str) {
		return str.replace(regex, replaceTag);
	}	
}())

tags.id = (function(){
	var unique = 1
	return function() {
		return '__tag'+(unique++)
	}
}())

tags.create = (typeof Object.create == 'function'
	? function nativeCreate(protoObj) { return Object.create(protoObj) }
	: function shimCreate(protoObj) { function F(){}; F.prototype = protoObj; return new F() }
)

tags.options = function options(opts, defaults) {
	if (!opts) { opts = {} }
	var result = {}
	for (var key in defaults) {
		result[key] = (typeof opts[key] != 'undefined' ? opts[key] : defaults[key])
	}
	return result
}

tags.extend = function extend(target, extendWith) {
	for (var key in extendWith) {
		if (typeof target[key] != 'undefined') { continue }
		target[key] = extendWith[key]
	}
	return target
}

tags.makePos = function makePos(x,y) {
	var pos = [x, y]
	pos.x = x
	pos.y = y
	return pos
}

tags.eventPos = function eventPos($e, index) {
	var obj = tags.isTouch ? $e.originalEvent.changedTouches[index || 0] : $e.originalEvent
	return tags.makePos(obj.pageX, obj.pageY)
}

tags.screenPos = function screenPos(el) {
	var box = $(el)[0].getBoundingClientRect()
	return tags.makePos(box.left, box.top)
}

tags.subPos = function subPos(p1, p2) {
	return tags.makePos(p1[0] - p2[0], p1[1] - p2[1])
}
tags.addPos = function addPos(p1, p2) {
	return tags.makePos(p1[0] + p2[0], p1[1] + p2[1])
}

tags.classNames = function classNames(c1, c2) {
	return c1 + (c2 ? ' ' + c2 : '')
}

tags.isTouch = (function() {
	try {
		document.createEvent("TouchEvent")
		return ('ontouchstart' in window)
	} catch (e) {
		return false
	}
}())

tags.events = {
	start: tags.isTouch ? 'touchstart' : 'mousedown',
	move: tags.isTouch ? 'touchmove' : 'mousemove',
	cancel: tags.isTouch ? 'touchcancel' : 'mousecancel',
	end: tags.isTouch ? 'touchend' : 'mouseup'
}
