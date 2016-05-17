
var h = require('hyperscript')
var u = require('../util')
var pull = require('pull-stream')

exports.message_confirm = []
exports.message_link = []

exports.message_content = function (msg, sbot) {
  if(msg.value.content.type !== 'vote') return
  var link = msg.value.content.vote.link
  return h('div', msg.value.content.vote.value > 0 ? 'yup' : 'nah',
      u.decorate(exports.message_link, link, function (d, e, v) { return d(e, v, sbot) })
    )
}

exports.message_meta = function (msg, sbot) {

  var yupps = h('a')

  pull(
    sbot.links({dest: msg.key, rel: 'vote'}),
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

      u.firstPlug(exports.message_confirm, yup, sbot)
    }}, 'yup')

}


