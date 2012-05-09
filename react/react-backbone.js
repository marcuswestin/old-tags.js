tags.react = {
	text:text
}

function text(model, key) {
	return function($tag) {
		var textNode = $tag[0].appendChild(document.createTextNode(model.get(key)))
		model.on('change:'+key, function() {
			textNode.nodeValue = model.get(key)
		})
	}
}
