const nest = require('depnest')
const { assign } = Object
const fs = require('fs')
const path = require('path')

const hljsPath = '../../../node_modules/highlight.js/styles/github.css'
const hljs = fs.readFileSync(path.join(__dirname, hljsPath), 'utf8')

exports.gives = nest('styles.css')

exports.create = function (api) {
  return nest('styles.css', (sofar = {}) => {
    return assign(sofar, { globalStyles })
  })
}

const globalStyles = `
body {
  font-family: helvetica, sans-serif;
  font-size: 14px;
  line-height: 1.4;
  color: #222;
}

* {
  word-break: break-word;
}

a:link, a:visited, a:active {
  color: #0088cc;
  text-decoration: none;
}

a:hover, a:focus {
  color: #005580;
  text-decoration: underline;
}

input:focus, .compose:focus {
  outline: none;
}

input, textarea {
  border: 1px solid gainsboro;
  font-family: sans-serif;
}

textarea {
  padding: .5em;
  font-size: 1em;
}

textarea:focus {
  outline: none;
  border-color: none;
}

${hljs}
`
