var h = require('hyperscript')
//this decorator expects to be the first
exports.message_compose = function (el, meta, sbot) {
  if(el) return el

  meta = meta || {}
  var ta = h('pre.editable.fixed', 'HELLO')
  ta.setAttribute('contenteditable', '')

  return h('div', h('div.column', ta,
    h('button', 'publish', {onclick: function () {
      meta.text = ta.innerText || ta.textContent
      alert(JSON.stringify(meta, null, 2))
    }})))
}



