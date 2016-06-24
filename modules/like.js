
var h = require('hyperscript')
var u = require('../util')
var pull = require('pull-stream')

var plugs = require('../plugs')

var message_confirm = plugs.first(exports.message_confirm = [])
var message_link = plugs.first(exports.message_link = [])
var sbot_links = plugs.first(exports.sbot_links = [])

exports.message_content = function (msg, sbot) {
  if(msg.value.content.type !== 'vote') return
  var link = msg.value.content.vote.link
  return h('div',
      msg.value.content.vote.value > 0 ? 'yup' : 'nah',
      ' ', message_link(link)
    )
}

exports.message_meta = function (msg, sbot) {

  var yupps = h('a')

  pull(
    sbot_links({dest: msg.key, rel: 'vote'}),
    pull.collect(function (err, votes) {
      if(votes.length === 1)
        yupps.textContent = ' 1 yup'
      if(votes.length)
        yupps.textContent = ' ' + votes.length + ' yupps'
    })
  )

  return yupps
}

exports.message_action = function (msg, sbot) {
  if(msg.value.content.type !== 'vote')
    return h('a', {href: '#', onclick: function () {
      var yup = {
        type: 'vote',
        vote: { link: msg.key, value: 1, expression: 'yup' }
      }
      if(msg.value.content.recps) {
        yup.recps = msg.value.content.recps.map(function (e) {
          return e.link || e
        })
        yup.private = true
      }
      //TODO: actually publish...

      message_confirm(yup)
    }}, 'yup')

}

