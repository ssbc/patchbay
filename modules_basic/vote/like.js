var h = require('hyperscript')
var pull = require('pull-stream')

exports.needs = {
  about: { name: 'first' },
  message: {
    confirm: 'first',
    link: 'first'
  },
  sbot: { links: 'first' }
}

exports.gives = {
  message: {
    content: true,
    content_mini: true,
    meta: true,
    action: true
  }
}

exports.create = function (api) {
  return { 
    message: {
      content,
      content_mini: content,
      meta,
      action
    }
  }


  function content (msg, sbot) {
    if(msg.value.content.type !== 'vote') return
    var link = msg.value.content.vote.link
    return [
      msg.value.content.vote.value > 0 ? 'dug' : 'undug',
      ' ',
      api.message.link(link)
    ]
  }

  function meta (msg, sbot) {
    var digs = h('a')

    var votes = []
    for(var k in CACHE) {
      if(CACHE[k].content.type == 'vote' &&
        (CACHE[k].content.vote == msg.key ||
        CACHE[k].content.vote.link == msg.key
        ))
        votes.push({source: CACHE[k].author, dest: k, rel: 'vote'})
    }

    if (votes.length === 0) return

    const symbol = '\u2713' // tick  🗸

    digs.textContent = votes.length > 4
      ? votes.length + ' ' + symbol
      : Array(votes.length).fill(symbol).join('')

    pull(
      pull.values(votes.map(vote => api.about.name(vote.source))),
      pull.collect((err, ary) => {
        if (err) console.error(err)
        digs.title = 'Dug by:\n' + ary.map(x => x.innerHTML).join("\n")
      })
    )

    return digs
  }

  function action (msg, sbot) {
    if(msg.value.content.type !== 'vote')
      return h('a.dig', {href: '#', onclick: function () {
        var dig = {
          type: 'vote',
          vote: { link: msg.key, value: 1, expression: 'Dig' }
        }
        if(msg.value.content.recps) {
          dig.recps = msg.value.content.recps.map(function (e) {
            return e && typeof e !== 'string' ? e.link : e
          })
          dig.private = true
        }
        //TODO: actually publish...

        api.message.confirm(dig)
      }}, 'Dig')

  }
}

