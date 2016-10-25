
var h = require('hyperscript')
var u = require('../util')
var pull = require('pull-stream')

var plugs = require('../plugs')

var message_confirm = plugs.first(exports.message_confirm = [])
var message_link = plugs.first(exports.message_link = [])
var sbot_links = plugs.first(exports.sbot_links = [])


exports.message_content =
exports.message_content_mini = function (msg, sbot) {
  if(msg.value.content.type !== 'vote') return
  var link = msg.value.content.vote.link
  return [
      msg.value.content.vote.value > 0 ? 'Dug' : 'Undug',
      ' ', message_link(link)
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

  if(votes.length === 1)
    digs.textContent = ' 1 Dig'
  if(votes.length > 1)
    digs.textContent = ' ' + votes.length + ' Digs'

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

      message_confirm(dig)
    }}, 'Dig')

}

