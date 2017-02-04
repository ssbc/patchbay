var h = require('hyperscript')
var pull = require('pull-stream')

exports.needs = {
  avatar_name: 'first',
  message_confirm: 'first',
  message_link: 'first',
  sbot_links: 'first'
}

exports.gives = {
  message_content: true,
  message_content_mini: true,
  message_meta: true,
  message_action: true
}

exports.create = function (api) {
  var exports = {}

  exports.message_content =
  exports.message_content_mini = function (msg, sbot) {
    if(msg.value.content.type !== 'vote') return
    var link = msg.value.content.vote.link
    return [
        msg.value.content.vote.value > 0 ? 'dug' : 'undug',
        ' ', api.message_link(link)
      ]
  }

  exports.message_meta = function (msg, sbot) {
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

    digs.textContent = votes.length > 4
      ? votes.length + ' \u2713'
      : Array(votes.length).fill('\u2713').join('')

    pull(
      pull.values(votes.map(vote => api.avatar_name(vote.source))),
      pull.collect((err, ary) => {
        if (err) console.error(err)
        digs.title = 'Dug by:\n' + ary.map(x => x.innerHTML).join("\n")
      })
    )

    return digs
  }

  exports.message_action = function (msg, sbot) {
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

        api.message_confirm(dig)
      }}, 'Dig')

  }
  return exports
}
