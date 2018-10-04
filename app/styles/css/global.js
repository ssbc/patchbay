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
  color: #93a1a1; // XXX hardcode
}

* {
  word-break: break-word;
}

a:link, a:visited, a:active {
  color: var(--blue);
  text-decoration: none;
}

a:hover, a:focus {
  color: var(--indigo);
  text-decoration: underline;
}

input:focus, .compose:focus {
  outline: none;
}

input, textarea {
  background: var(--background);
  border: 1px solid var(--highlight);
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
