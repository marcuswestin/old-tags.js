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
		
		var classesHTML = classes.length ? ' class="'+classes.join(' ')+'" ' : ''
		var stylesHTML = styles.length ? ' style="'+styles.join('; ')+'" ' : ''
		return {
			__tagHTML:'<'+tagName+' '+attributes.join(' ')+classesHTML+stylesHTML+'>'+content.join('')+'</'+tagName+'>',
			toString:tagToString
		}
	}
}

function tagToString() { return this.__tagHTML }

function handleTagArgs(args, i, content, attributes, classes, styles) {
	for (; i<args.length; i++) {
		handleTagArg(args[i], content, attributes, classes, styles)
	}
}

function handleTagArg(arg, content, attributes, classes, styles) {
	var type = typeof arg
	if (arg == null) {
		// null and undefined - do nothing
	} else if (arg.__tagHTML) {
		content.push(arg.__tagHTML)
	} else if (arg.__renderTag) {
		content.push(arg.__renderTag())
	} else if (typeof arg == 'string') {
		content.push(safeHTML(arg))
	} else if (typeof arg == 'number') {
		content.push(arg)
	} else if ($.isArray(arg)) {
		handleTagArgs(arg, 0, content, attributes, classes, styles)
	} else if (typeof arg == 'function') {
		handleTagArg(arg(), content, attributes, classes, styles)
	} else {
		each(arg, function(val, key) {
			if (key == 'style') {
				styles.push(val)
			} else if (key == 'class') {
				classes.push(val)
			} else {
				attributes.push(key+'="'+safeAttr(val)+'"')
			}
		})
	}
}

var safeAttr = (function() {
	var regex = /"/g
	return function(str) {
		return str.replace(regex, '\\"')
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

tags.eventPos = function eventPos($e, index) {
	var obj = tags.isTouch ? $e.originalEvent.changedTouches[index || 0] : $e.originalEvent
	return { x:obj.pageX, y:obj.pageY }
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
