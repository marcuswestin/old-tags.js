tags.router = function() {
	return tags.create(baseRouter).init()
}

var baseRouter = {
	init:function() {
		this._routes = []
		return this
	},
	add:function(path, render) {
		var regexp = new RegExp('^'+path.replace(/\*/g, '(\\w+)')+'$')
		this._routes.push({ path:path, render:render, regexp:regexp })
		return this
	},
	route:function(handler) {
		this._changeHandler = handler
		window.onpopstate = bind(this, this._onChange)
		var self = this
		setTimeout(function() {
			// In Chrome, assigning onpopstate automatically fires the handler
			// In Firefox, it does not. Manually call onChange if it was not already called once
			if (!self._fired) { self._onChange() }
		})
		return this
	},
	error:function(handler) {
		this._errorHandler = handler
		return this
	},
	go:function(path) {
		if (path[0] != '/') { path = location + '/' + path }
		history.pushState(null, null, path)
		this._onChange()
		return this
	},
	_onChange:function() {
		this._fired = true
		var path = location.pathname
		for (var i=0; i<this._routes.length; i++) {
			var route = this._routes[i]
			var match = path.match(route.regexp)
			if (match) {
				return this._changeHandler(route.render, match.slice(1))
			}
		}
		this._changeHandler(this._errorHandler)
	}
}
