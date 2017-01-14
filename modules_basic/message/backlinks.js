const fs = require('fs')
const h = require('../../h')

exports.needs = {
  message_name: 'first'
}

exports.gives = {
  message_backlinks: true,
  mcss: true
}

exports.create = function (api) {
  return {
    message_backlinks,
    mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
  }

  function message_backlinks (msg) {
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
      api.message_name(link, (err, name) => {
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
