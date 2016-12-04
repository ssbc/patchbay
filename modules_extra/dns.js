var h = require('hyperscript')

function array(obj) {
  return !obj ? [] : Array.isArray(obj) ? obj : [obj]
}

function idLink(id) {
  return h('a', {href: '#'+id}, id.substring(0, 10)+'…')
}

exports.gives = 'message_content'

exports.create = function () {
  return function (msg, sbot)  {
    var c = msg.value.content

    if(c.type === 'ssb-dns') {
      var record = c.record || {}
      return h('div',
        h('p',
          h('ins', {title: 'name'}, record.name), ' ',
          h('em', {title: 'ttl'}, record.ttl), ' ',
          h('span', {title: 'class'}, record.class), ' ',
          h('span', {title: 'type'}, record.type),
        h('pre', {title: 'data'},
          JSON.stringify(record.data || record.value, null, 2)),
        !c.branch ? null : h('div', h('span',
          'replaces: ', array(c.branch).map(idLink)))
      ))
    }
  }

}
