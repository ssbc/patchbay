const fs = require('fs')
const h = require('../../h')

exports.needs = {
  message: { name: 'first' }
}

exports.gives = {
  message: { backlinks: true }
}

exports.create = function (api) {
  return {
    message: { backlinks }
  }

  function backlinks (msg) {
    var links = []
    for(var k in CACHE) {
      var _msg = CACHE[k]
      var mentions = _msg.content.mentions

      if(Array.isArray(mentions)) {
        for(var i = 0; i < mentions.length; i++)
          if(mentions[i].link == msg.key)
            links.push(k)
      }
    }

    if (links.length === 0) return null

    var hrefList = h('ul')
    links.forEach(link => {
      api.message.name(link, (err, name) => {
        if (err) throw err
        hrefList.appendChild(h('li',
          h('a -backlink', { href: `#${link}` }, name)
        ))
      })
    })
    return h('MessageBacklinks', [
      h('header', 'backlinks:'),
      hrefList
    ])
  }
}
