var tags = require('./tags')
var button = require('./button')

var div = tags('div')
var a = tags('a')

module.exports = link

link.defaultTarget = null
function link(className, title, path) {
	if (arguments.length == 2) {
		path = title
		title = className
		className = ''
	}
	if (typeof path == 'function') {
		return div('link '+className, title, button(path))
	} else {
		return a('link '+className, title, attr({ href:path, target:link.defaultTarget }))
	}
}
