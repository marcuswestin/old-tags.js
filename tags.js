var arrayToObject = require('std/arrayToObject')
var create = tags.create = require('std/create')
var options = tags.options = require('std/options')
var each = tags.each = require('std/each')
var isArray = tags.isArray = require('std/isArray')
var array = tags.array = require('std/array')
var setProps = require('std/setProps')
var isElement = require('std/isElement')
var map = require('std/map')

/* API
******/
module.exports = setProps(tags, {
	attr: attr,
	style: style,
	classes: classes,
	dangerouslyInsertHtml: dangerouslyInsertHtml,
	isSafeHtml: isSafeHtml,
	destructible: setProps(destructible, {
		attrs: destructibleAttrs,
		class: 'tags-destructible'
	})
})

tags.warn = warn
tags.uid = uid

tags.isTouch = _isTouch()

tags.events = {
	start: tags.isTouch ? 'touchstart' : 'mousedown',
	move: tags.isTouch ? 'touchmove' : 'mousemove',
	cancel: tags.isTouch ? 'touchcancel' : 'mousecancel',
	end: tags.isTouch ? 'touchend' : 'mouseup'
}

var ua = window.navigator.userAgent
tags.isHandheldSafari = ua.match(/(iPod|iPhone)/) && ua.match(/Safari/)
tags.isIOSSafari = ua.match(/(iPod|iPhone|iPad)/) && ua.match(/Safari/)

/* Tag creators
***************
*
* var div = tags('div')
* var span = tags('span')
* $('body').append(
*     div('name', 'Marcus Westin')               =>   <div class="names">Marcus Westin</div>
*     div('bold name', 'Ashley', ' ', 'Baker')   =>   <div class="bold name">Ashley Baker</div>
* )
*/
function tags(tagName) {
	return function createTagFn() {
		var classList = []
		var content = []
		var attributes = []
		var styles = []
		
		if (typeof arguments[0] == 'string') {
			classList.push(_safeAttr(arguments[0]))
			_handleTagArgs(arguments, 1, content, attributes, classList, styles)
		} else {
			_handleTagArgs(arguments, 0, content, attributes, classList, styles)
		}
		
		var classListHtml = (classList.length ? ' class="'+_safeAttr(classList.join(' '))+'" ' : '')
		var stylesHtml = (styles.length ? ' style="'+_safeAttr(styles.join('; '))+'" ' : '')
		return create(dangerouslyInsertHtmlBase, {
			_html:'<'+tagName+' '+attributes.join(' ')+classListHtml+stylesHtml+'>'+content.join('')+'</'+tagName+'>'
		})
	}
}

/* Attributes
 ************
 *
 * div(attr({ id:'foo' })                                    =>   <div id="foo"></div>
 * input(attr({ type:'tel', placeholder:'Phone Number' }))   =>   <input type="tel" placeholder="Phone Number"></input>
 */
var _attributeWhitelist = arrayToObject('id,type,name,src,href,placeholder,value,target,frameborder,contenteditable'.split(','))
var _attributeWhitelistRegex = /^(tags-\S*|data-\S*)$/i
var attrBase = { _html:'' }
function attr(attributes) {
	var attribute = create(attrBase, { _html:'' })
	each(attributes, function(attrValue, attrName) {
		if (!_attributeWhitelist[attrName] && !_attributeWhitelist[attrName.toLowerCase()] && !_attributeWhitelistRegex.test(attrName)) {
			return tags.warn('Non-whitelisted attribute', attrName, attrValue)
		}
		attribute._html += _safeAttr(attrName)+'="'+_safeAttr(attrValue)+'" '
	})
	return attribute
}

/* Styles
 ********
 *
 * div(style({ width:10, height:10, background:'red' }), "Hello")   =>   <div style="width:10px; height:10px; background:red; ">Hello</div>
 * span(style({ color:'red', fontFamily:'sans-seris' }), "Hello")   =>   <span style="color:red; font-family:sans-serif; ">Hello</span>
 */
var styleBase = {}
function style() {
	var _html = ''
	each(arguments, function(arg) {
		each(arg, function(styleValue, styleName) {
			if (typeof styleValue == 'number' && !_pxPostfixBlacklist[styleName]) { styleValue += 'px' }
			_html += _toDashes(styleName)+':'+styleValue+';'
		})
	})
	return create(styleBase, { _html:_safeAttr(_html) })
}

var _pxPostfixBlacklist = arrayToObject('opacity,zIndex,fontWeight'.split(','))
var _vendorPrefixed = arrayToObject('backface-visibility,transform,perspective,transform-style,transition,overflow-scrolling,filter'.split(','))
function _toDashes(name) {
	name = name.replace(/([A-Z])/g, function($1) { return "-" + $1.toLowerCase() })
	return (_vendorPrefixed[name] ? '-webkit-'+name : name)
}

/* Display strings of HTML
 *************************
 *
 * div(style({ color:'red' }), dangerouslyInsertHtml('<span>foo bar  </span>'))   =>   '<div style="color:red;"><span>foo bar  </span></div>''
 * div(dangerouslyInsertHtml('<script>alert("XSS Fool")</script>'))               =>   '<div><script>alert("XSS Fool")</script></div>
 */
var dangerouslyInsertHtmlBase = { toString:_getDangerousHtml }
function _getDangerousHtml() { return this._html }
function dangerouslyInsertHtml(html) {
	return create(dangerouslyInsertHtmlBase, { _html:html })
}


/* Add additional class names
 ****************************
 *
 * div('button', 'Hello', classes('bold underline'))   =>   <div class="button bold underline">Hello</div>
 */
var classesBase = {}
function classes(classStr) {
	return create(classesBase, { _html:_safeAttr(classStr) })
}


/* Destroy views to clean up state
 *********************************
 *
 * return div('myView', div('myList', tags.destructible(_destroyMyList)))
 * function _destroyMyList() { this == $('div.myList')[0] }
 * ...
 * tags.destroy($('.myView')) // calls _destroyMyList
 */
function destructible(uid, destructorFn) {
	return [tags.classes(tags.destructible.class), tags.attr(tags.destructible.attrs(uid, destructorFn))]
}

var Destructors = {}
function destructibleAttrs(uid, destructorFn) {
	if (!destructorFn && typeof uid == 'function') {
		destructorFn = uid
		uid = null
	}
	if (!destructorFn._destructorUid) {
		destructorFn._destructorUid = tags.uid()
		Destructors[destructorFn._destructorUid] = destructorFn
	}
	if (uid) {
		return { 'tags-destructorUid':destructorFn._destructorUid, 'tags-uid':uid }
	} else {
		return { 'tags-destructorUid':destructorFn._destructorUid }
	}
}

function _destroyEl() {
	var destructorUid = this.getAttribute('tags-destructorUid')
	var uidIfSet = this.getAttribute('tags-uid')
	Destructors[destructorUid].call(this, uidIfSet)
}

/* Misc
*******/
function isSafeHtml(obj) {
	return dangerouslyInsertHtmlBase.isPrototypeOf(obj)
}

function warn() {
	console.warn.apply(console, slice(arguments))
}

function _isTouch() {
	try {
		document.createEvent("TouchEvent")
		return ('ontouchstart' in window)
	} catch (e) {
		return false
	}
}

uid._t = 1
function uid() { return '_t'+(uid._t++) }

tags.br = create(dangerouslyInsertHtmlBase, { _html:'<br/>' })



/* Style helpers
****************/
setProps(tags.style, {
	translate:setProps(translate, {
		y: translateY,
		x: translateX,
		z: translateZ,
		xyz: translateXYZ
	}),
	rotate:rotate,
	transition:transition,
	scrollable: {
		x: { overflowX:'auto', overflowScrolling:'touch', overflowY:'hidden' },
		y: { overflowY:'auto', overflowScrolling:'touch', overflowX:'hidden' },
		none: { overflow:'hidden', overflowScrolling:'none' }
	}
})

function translate(x, y, duration, delay) {
	if (isObject(x)) {
		// translate({ x:10, y:20 }, 100, 200)
		delay = duration
		duration = y
		y = x.y
		x = x.x
	}
	return _transform('translate3d('+Math.round(x)+'px, '+Math.round(y)+'px, 0px)', duration, delay)
}
function translateY(y, duration, delay) {
	return _transform('translateY('+Math.round(y)+'px)', duration, delay)
}
function translateX(x, duration, delay) {
	return _transform('translateX('+Math.round(x)+'px)', duration, delay)
}
function translateZ(z, duration, delay) {
	return _transform('translateZ('+Math.round(z)+'px)', duration, delay)
}
function translateXYZ(x,y,z, duration, delay) {
	return _transform('translate3d('+Math.round(x)+'px, '+Math.round(y)+'px, '+Math.round(z)+'px)', duration, delay)
}
function rotate(fraction, duration, delay) {
	return _transform('rotate('+Math.round(fraction*360)+'deg)', duration, delay)
}
function transition(properties, duration) {
	if (typeof properties == 'object') {
		var res = array(properties, function(val, key) {
			return _toDashes(key)+' '+properties[key]+'ms'
		})
		return { '-webkit-transition':res.join(',') }
	} else {
		return { '-webkit-transition':_toDashes(properties)+' '+duration+'ms' }
	}
}

function _transform(transformation, duration, delay) {
	var styles = { '-webkit-transform':transformation }
	if (duration != null && !isNaN(duration)) { styles['-webkit-transition'] = '-webkit-transform '+Math.round(duration)+'ms' }
	if (delay != null && !isNaN(delay)) { styles['-webkit-transition-delay'] = delay+'ms' }
	return styles
}



/* Internal utils
*****************/
function _handleTagArgs(args, i, content, attributes, classList, styles) {
	for (; i<args.length; i++) {
		_handleTagArg(args[i], content, attributes, classList, styles)
	}
}

function _handleTagArg(arg, content, attributes, classList, styles) {
	if (arg == null) { return }
	
	if (isObject(arg)) {
		if (dangerouslyInsertHtmlBase.isPrototypeOf(arg)) {
			return content.push(arg._html)
			
		} else if (styleBase.isPrototypeOf(arg)) {
			return styles.push(arg._html)
			
		} else if (attrBase.isPrototypeOf(arg)) {
			return attributes.push(arg._html)
			
		} else if (classesBase.isPrototypeOf(arg)) {
			return classList.push(arg._html)
			
		} else if (tags.isSafeToTag(arg.toTag)) {
			return content.push(arg.toTag.__customTag(arg))
			
		} else {
			tags.warn('Object tag content', arg)
			return content.push(_safeHtml(JSON.stringify(arg)))
		}
	
	} else {
		var type = typeof arg
		if (isArray(arg)) {
			return _handleTagArgs(arg, 0, content, attributes, classList, styles)
			
		} else if (type == 'string') {
			return content.push(_safeHtml(arg))
			
		} else if (type == 'function') {
			return _handleTagArg(arg(), content, attributes, classList, styles)
			
		} else if (type == 'number') {
			return content.push(arg)
			
		} else if (type == 'boolean') {
			return // do nothing
			
		} else {
			return tags.warn('Unknown non-object arg', arg)
		}
	}
}

_safeAttr.regex = /"/g
function _safeAttr(attr) {
	return attr.replace(_safeAttr.regex, '')
}

var _tagsToReplace = { '&':'&amp;', '<':'&lt;', '>':'&gt;' }
var _unsafeRegexpString = '['+array(_tagsToReplace, function(_, symbol) { return symbol }).join('')+']'
var _unsafeRegexp = new RegExp(_unsafeRegexpString,'g')
function _replaceUnsafeTag(tag) { return _tagsToReplace[tag] }
function _safeHtml(rawHtml) {
	return rawHtml.replace(_unsafeRegexp, _replaceUnsafeTag)
}



/* DOM manipulation
*******************/
tags.byId = function(id) {
	var selector = '#'+id+' '+slice(arguments, 1).join(' ')
	return tags.wrap(document.querySelector(selector))
}
tags.select = function() {
	var selector = slice(arguments).join(' ')
	return tags.wrap(this.el.querySelector(selector))
}
tags.wrap = function(el) {
	return tags.create(selectionBase, { el:el })
}
tags.pointer = function($e, i) {
	var obj = tags.isTouch ? $e.originalEvent.touches[i || 0] : $e.originalEvent
	return { x:obj.pageX, y:obj.pageY }
}

tags.dom = {
	destroy: function(el) {
		var $el = $(el)
		$el.find('.'+tags.destructible.class).each(_destroyEl)
		if ($el.hasClass(tags.destructible.class)) { _destroyEl.call(el) }
	},
	above: function(el, targetClass) {
		while (el && !tags.dom.hasClass(el, targetClass)) {
			el = el.parentNode
		}
		return el
	},
	append: function(el, tag) {
		if (isElement(tag)) {
			var appendEl = tag
		} else if (selectionBase.isPrototypeOf(tag)) {
			var appendEl = tag.el
		} else {
			var appendEl = document.createElement('div')
			appendEl.innerHTML = _htmlFromArg(tag)
		}
		el.appendChild(appendEl)
		return tags
	},
	appendTo: function(el, appendToEl) {
		return tags.append(appendToEl, el)
	},
	remove: function(el) {
		el.parentNode.removeChild(el)
		return tags
	},
	prepend: function(el, tag) {
		var newDiv = document.createElement('div')
		newDiv.innerHTML = _htmlFromArg(tag)
		if (el.children[0]) { el.insertBefore(newDiv, el.children[0]) }
		else { el.appendChild(newDiv) }
		return tags
	},
	empty: function(el) {
		el.innerHTML = ''
		return tags
	},
	select: function() {
		var selector = slice(arguments, 1).join(' ')
		return tags.wrap(this.el.querySelector(selector))
	},
	css: function(el, values) {
		$.fn.css.call($(el), values)
	},
	clone: function(el) {
		return tags.wrap(el.cloneNode(true))
	},
	offset: function(el) {
		return $.fn.offset.call($(el))
	},
	frame: function(el) {
		return setProps(tags.offset(el), { width:el.offsetWidth, height:el.offsetHeight })
	},
	addClass: function(el, className) {
		el.classList.add(className)
	},
	removeClass: function(el, className) {
		el.classList.remove(className)
	},
	toggleClass: function(el, className) {
		el.classList.toggle(className)	
	},
	hasClass: function(el, className) {
		return el.classList.contains(className)
	},
	height: function(el) {
		return el.offsetHeight
	},
	attr: function(el, values) {
		$.fn.attr.call($(el), values)
	},
	text: function(el, text) {
		el.textContent = text
	}
}
var selectionBase = (function() {
	var selectionBase = {}
	return map(tags.dom, function(fn, name) {
		return _selectionFn(fn)
	})
	
	function _selectionFn(domFn) {
		return function() {
			var args = [this.el].concat(slice(arguments))
			var result = domFn.apply(this, args)
			return ((result != null && result != tags) ? result : this)
		}
	}
}());

function _htmlFromArg(tag) {
	if (!tag) { return '' }
	var html = ''
	if (isArray(tag)) {
		each(tag, function(tag) {
			if (!tag) { return }
			if (!tags.isSafeHtml(tag)) { return tags.warn('Unsafe tags.append', tag) }
			html += tag._html
		})
	} else {
		if (!tags.isSafeHtml(tag)) { return tags.warn('Unsafe tags.append', tag) }
		html += tag._html
	}
	return html
}



/* Event positions
******************/
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



/* Templates
* Work in progress
*******************/
var customTagBase = { __customTag:function(ctx) { return this.contentFn.call(ctx)._html } }
tags.toTag = function(contentFn) {
	return create(customTagBase, { contentFn:contentFn })
}
tags.isSafeToTag = function(toTag) {
	if (customTagBase.isPrototypeOf(toTag)) { return true };
	tags.warn('Tags encountered a dangerous .toTag()')
	return false
}


// ;(function tagsTemplates() {
// 	tags.holder = function(holderName) {
// 		currentTemplateHolderNames.push(holderName)
// 		return { toTag:tags.toTag(function() {
// 			return {
// 				toHtml:function() { return '{{_'+holderName+'_}}' }
// 			}
// 		})}
// 	}
//
// 	var currentTemplateHolderNames = []
// 	tags.template = function(content) {
// 		var html = content.toHtml()
// 		var res = tags.extend(create(templateBase), { html:html, holderNames:currentTemplateHolderNames })
// 		currentTemplateHolderNames = []
// 		return res
// 	}
//
// 	var templateBase = {
// 		render:function(obj) {
// 			var html = this.html
// 			each(this.holderNames, function(holderName) {
// 				var val = obj[holderName]
// 				if (typeof val == 'function') { val = val() }
// 				html = html.replace('{{_'+holderName+'_}}', val ? (val.toHtml ? val.toHtml() : val) : '')
// 			})
// 			return { __tagHTML:html, toHtml:tagsToHtml }
// 		}
// 	}
//
// function tagsToHtml() { return this.__tagHTML || this.__renderTag() }
//
// })()

