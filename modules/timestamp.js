var h = require('hyperscript')
var moment = require('moment')

function updateTimestampEl(el) {
  el.firstChild.nodeValue = el.timestamp.fromNow()
  return el
}

setInterval(function () {
  var els = [].slice.call(document.querySelectorAll('.timestamp'))
  els.forEach(updateTimestampEl)
}, 60e3)

exports.message_meta = function (msg) {
  var m = moment(msg.value.timestamp)
  return updateTimestampEl(h('a.enter.timestamp', {
    href: '#'+msg.key,
    timestamp: m,
    title: m.format('LLLL')
  }, ''))
}
