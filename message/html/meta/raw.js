const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('message.html.meta')

exports.needs = nest({
  'about.obs.name': 'first',
  'message.obs.likes': 'first'
})

exports.create = (api) => {
  return nest('message.html.meta', raw)

  function raw (msg, { rawMessage } = {}) {
    return h('i.fa.fa-plus', {
      title: 'View raw data',
      style: {
        order: 99,
        color: '#a8a8a8',
        cursor: 'pointer'
      },
      'ev-click': () => (rawMessage() === null)
        ? rawMessage.set(buildRawMsg(msg))
        : rawMessage.set(null)
    })
  }
}

function buildRawMsg (msg) {
  return h('pre',
    colorKeys(linkify(
      JSON.stringify({ key: msg.key, value: msg.value }, 0, 2)
    ))
  )
}

function colorKeys (chunks) {
  var newArray = []
  chunks.forEach(chunk => {
    if (typeof chunk !== 'string') return newArray.push(chunk)

    var arr = chunk.split(/("[^"]+":)/)
    for (var i = 1; i < arr.length; i += 2) {
      arr[i] = h('span', arr[i])
    }
    newArray = [...newArray, ...arr]
  })

  return newArray
}

function linkify (text) {
  // from ssb-ref
  var refRegex = /((?:@|%|&)[A-Za-z0-9/+]{43}=\.[\w\d]+)/g

  var arr = text.split(refRegex)
  for (var i = 1; i < arr.length; i += 2) {
    arr[i] = h('a', {href: arr[i]}, arr[i])
  }
  return arr
}
