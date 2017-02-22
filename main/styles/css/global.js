const nest = require('depnest')
const { assign } = Object

exports.gives = nest('styles.css')

exports.create = function (api) {
  return nest('styles.css', (sofar = {}) => {
    return assign(sofar, { globalStyles })
  })
}

const globalStyles = `
body {
  font-family: sans-serif;
  color: #222;
}

h1, h2, h3, h4, h5, h6, p, ul, ol {
  margin-top: .35em;
}

h1 { font-size: 1.2em; }
h2 { font-size: 1.18em; }
h3 { font-size: 1.15em; }
h4 { font-size: 1.12em; }
h5 { font-size: 1.1em; }
h6 { font-size: 1em; }

* {
  word-break: break-word;
}

a:link, a:visited, a:active {
  color: #0088cc;
  text-decoration: none;
}

a:hover,
a:focus {
  color: #005580;
  text-decoration: underline;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}

p {
  margin-top: .35ex;
}

hr {
  border: solid #eee;
  clear: both;
  border-width: 1px 0 0;
  height: 0;
  margin-bottom: .9em;
}

input, textarea {
  border: none;
  border-radius: .2em;
  font-family: sans-serif;
}

input:focus, .compose:focus, button:focus {
  outline: none;
  border-color: #0088cc; 
  box-shadow: 0 0 4px #0088cc;
}

textarea {
  padding: .5em;
  font-size: 1em;
}

textarea:focus {
  outline: none;
  border-color: none;
}

button {
  background: #fff;
  color: #666;
  border: 1px solid #bbb;
  border-radius: .5em;
  padding: .7em;
  margin: .5em;
  cursor: pointer;
  text-transform: uppercase;
  font-weight: bold;
  font-size: .7em;
}

button:hover {
  background: #ccc;
  border: 1px solid #bbb;
}

/* TextNodeSearcher highlights */

highlight {
  background: #ff8;
}
`

