const nest = require('depnest')
const { h, map, computed, when } = require('mutant')
const ref = require('ssb-ref')

exports.needs = nest({
  'message.obs.backlinks': 'first',
  'message.obs.name': 'first',
  'message.async.name': 'first',
  'sbot.sync.cache': 'first'
})

exports.gives = nest('message.html.backlinks')

exports.create = function (api) {
  return nest('message.html.backlinks', function (msg) {
    if (!ref.isMsg(msg.key)) return []
    var backlinks = api.message.obs.backlinks(msg.key)
    var references = computed([backlinks, msg], onlyReferences)
    return when(computed(references, hasItems),
      h('MessageBacklinks', [
        h('header', 'Referenced:'),
        h('ul', [
          map(references, (backlink) => {
            return h('li', [
              h('a -backlink', { href: backlink.id, title: backlink.id }, api.message.obs.name(backlink.id))
            ])
          })
        ])
      ])
    )
  })
}

function onlyReferences (backlinks, msg) {
  return backlinks.filter(link => link.root !== msg.key && !includeOrEqual(link.branch, msg.key))
}

function hasItems (items, msg) {
  return (items && items.length)
}

function includeOrEqual (valueOrArray, item) {
  if (Array.isArray(valueOrArray)) {
    return valueOrArray.includes(item)
  } else {
    return valueOrArray === item
  }
}
