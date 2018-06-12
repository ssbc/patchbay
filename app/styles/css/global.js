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
  border-color: #0088cc; 
  box-shadow: 0 0 4px #0088cc;
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


`
