var tags = require('./tags')

module.exports = function testXssInjections() {
	var content = _withoutWarnings(function() {
		// see https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
		var xssTestString = "';alert(String.fromCharCode(88,83,83))//';alert(String.fromCharCode(88,83,83))//\";\nalert(String.fromCharCode(88,83,83))//\";alert(String.fromCharCode(88,83,83))//--\n></SCRIPT>\">'><SCRIPT>alert(String.fromCharCode(88,83,83))</SCRIPT>"
		var xssTestStringVariations = [
			xssTestString,
			xssTestString.replace(/\n/g, ''),
			'%27%3B%61%6C%65%72%74%28%53%74%72%69%6E%67%2E%66%72%6F%6D%43%68%61%72%43%6F%64%65%28%38%38%2C%38%33%2C%38%33%29%29%2F%2F%27%3B%61%6C%65%72%74%28%53%74%72%69%6E%67%2E%66%72%6F%6D%43%68%61%72%43%6F%64%65%28%38%38%2C%38%33%2C%38%33%29%29%2F%2F%22%3B%0A%61%6C%65%72%74%28%53%74%72%69%6E%67%2E%66%72%6F%6D%43%68%61%72%43%6F%64%65%28%38%38%2C%38%33%2C%38%33%29%29%2F%2F%22%3B%61%6C%65%72%74%28%53%74%72%69%6E%67%2E%66%72%6F%6D%43%68%61%72%43%6F%64%65%28%38%38%2C%38%33%2C%38%33%29%29%2F%2F%2D%2D%0A%3E%3C%2F%53%43%52%49%50%54%3E%22%3E%27%3E%3C%53%43%52%49%50%54%3E%61%6C%65%72%74%28%53%74%72%69%6E%67%2E%66%72%6F%6D%43%68%61%72%43%6F%64%65%28%38%38%2C%38%33%2C%38%33%29%29%3C%2F%53%43%52%49%50%54%3E',
			'&#x27;&#x3B;&#x61;&#x6C;&#x65;&#x72;&#x74;&#x28;&#x53;&#x74;&#x72;&#x69;&#x6E;&#x67;&#x2E;&#x66;&#x72;&#x6F;&#x6D;&#x43;&#x68;&#x61;&#x72;&#x43;&#x6F;&#x64;&#x65;&#x28;&#x38;&#x38;&#x2C;&#x38;&#x33;&#x2C;&#x38;&#x33;&#x29;&#x29;&#x2F;&#x2F;&#x27;&#x3B;&#x61;&#x6C;&#x65;&#x72;&#x74;&#x28;&#x53;&#x74;&#x72;&#x69;&#x6E;&#x67;&#x2E;&#x66;&#x72;&#x6F;&#x6D;&#x43;&#x68;&#x61;&#x72;&#x43;&#x6F;&#x64;&#x65;&#x28;&#x38;&#x38;&#x2C;&#x38;&#x33;&#x2C;&#x38;&#x33;&#x29;&#x29;&#x2F;&#x2F;&#x22;&#x3B;&#x0A;&#x61;&#x6C;&#x65;&#x72;&#x74;&#x28;&#x53;&#x74;&#x72;&#x69;&#x6E;&#x67;&#x2E;&#x66;&#x72;&#x6F;&#x6D;&#x43;&#x68;&#x61;&#x72;&#x43;&#x6F;&#x64;&#x65;&#x28;&#x38;&#x38;&#x2C;&#x38;&#x33;&#x2C;&#x38;&#x33;&#x29;&#x29;&#x2F;&#x2F;&#x22;&#x3B;&#x61;&#x6C;&#x65;&#x72;&#x74;&#x28;&#x53;&#x74;&#x72;&#x69;&#x6E;&#x67;&#x2E;&#x66;&#x72;&#x6F;&#x6D;&#x43;&#x68;&#x61;&#x72;&#x43;&#x6F;&#x64;&#x65;&#x28;&#x38;&#x38;&#x2C;&#x38;&#x33;&#x2C;&#x38;&#x33;&#x29;&#x29;&#x2F;&#x2F;&#x2D;&#x2D;&#x0A;&#x3E;&#x3C;&#x2F;&#x53;&#x43;&#x52;&#x49;&#x50;&#x54;&#x3E;&#x22;&#x3E;&#x27;&#x3E;&#x3C;&#x53;&#x43;&#x52;&#x49;&#x50;&#x54;&#x3E;&#x61;&#x6C;&#x65;&#x72;&#x74;&#x28;&#x53;&#x74;&#x72;&#x69;&#x6E;&#x67;&#x2E;&#x66;&#x72;&#x6F;&#x6D;&#x43;&#x68;&#x61;&#x72;&#x43;&#x6F;&#x64;&#x65;&#x28;&#x38;&#x38;&#x2C;&#x38;&#x33;&#x2C;&#x38;&#x33;&#x29;&#x29;&#x3C;&#x2F;&#x53;&#x43;&#x52;&#x49;&#x50;&#x54;&#x3E;',
			'&#39&#59&#97&#108&#101&#114&#116&#40&#83&#116&#114&#105&#110&#103&#46&#102&#114&#111&#109&#67&#104&#97&#114&#67&#111&#100&#101&#40&#56&#56&#44&#56&#51&#44&#56&#51&#41&#41&#47&#47&#39&#59&#97&#108&#101&#114&#116&#40&#83&#116&#114&#105&#110&#103&#46&#102&#114&#111&#109&#67&#104&#97&#114&#67&#111&#100&#101&#40&#56&#56&#44&#56&#51&#44&#56&#51&#41&#41&#47&#47&#34&#59&#10&#97&#108&#101&#114&#116&#40&#83&#116&#114&#105&#110&#103&#46&#102&#114&#111&#109&#67&#104&#97&#114&#67&#111&#100&#101&#40&#56&#56&#44&#56&#51&#44&#56&#51&#41&#41&#47&#47&#34&#59&#97&#108&#101&#114&#116&#40&#83&#116&#114&#105&#110&#103&#46&#102&#114&#111&#109&#67&#104&#97&#114&#67&#111&#100&#101&#40&#56&#56&#44&#56&#51&#44&#56&#51&#41&#41&#47&#47&#45&#45&#10&#62&#60&#47&#83&#67&#82&#73&#80&#84&#62&#34&#62&#39&#62&#60&#83&#67&#82&#73&#80&#84&#62&#97&#108&#101&#114&#116&#40&#83&#116&#114&#105&#110&#103&#46&#102&#114&#111&#109&#67&#104&#97&#114&#67&#111&#100&#101&#40&#56&#56&#44&#56&#51&#44&#56&#51&#41&#41&#60&#47&#83&#67&#82&#73&#80&#84&#62',
			'JzthbGVydChTdHJpbmcuZnJvbUNoYXJDb2RlKDg4LDgzLDgzKSkvLyc7YWxlcnQoU3RyaW5nLmZyb21DaGFyQ29kZSg4OCw4Myw4MykpLy8iOwphbGVydChTdHJpbmcuZnJvbUNoYXJDb2RlKDg4LDgzLDgzKSkvLyI7YWxlcnQoU3RyaW5nLmZyb21DaGFyQ29kZSg4OCw4Myw4MykpLy8tLQo+PC9TQ1JJUFQ+Ij4nPjxTQ1JJUFQ+YWxlcnQoU3RyaW5nLmZyb21DaGFyQ29kZSg4OCw4Myw4MykpPC9TQ1JJUFQ+'
		]
		return div(style(absolute(300, 10)),
			attr({ id:'xssTest' }),
			img(attr({ src:"javascript:alert('imgSrcJavascriptXss');" })),
			img(attr({ onload:"alert('imgOnLoadJavascriptXss');" })),
			img(attr({ onload:"alert('imgOnErrorJavascriptXss');" })),
			xssTestStringVariations,
			map(xssTestStringVariations, function(xssTestStringVariation) {
				return div(null, xssTestStringVariation)
			}),
			"'';!--\"<XSS>=&{()}",
			"<SCRIPT SRC=http://ha.ckers.org/xss.js></SCRIPT>"
		)
	})

	if (content._html.match('<XSS')) { alert("FOUND <XSS") }

	$('body').append(content)
}

function _withoutWarnings(fn) {
	var realWarn = tags.warn
	tags.warn = function(){}
	var res = fn()
	tags.warn = realWarn
	return res
}
