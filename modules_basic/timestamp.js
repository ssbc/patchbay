var h = require('hyperscript')
var _human = require('human-time')

function human (date) {
  var s =_human(date).split(' ')
  return s[0] + (s[1] == 'month' ? 'M' : s[1][0])
}

function updateTimestampEl(el) {
  el.firstChild.nodeValue = human(new Date(el.timestamp))
  return el
}

setInterval(function () {
  var els = [].slice.call(document.querySelectorAll('.timestamp'))
  els.forEach(updateTimestampEl)
}, 60e3)

exports.message_meta = function (msg) {
  var d = new Date(msg.value.timestamp)
  return updateTimestampEl(h('a.enter.timestamp', {
    href: '#'+msg.key,
    timestamp: msg.value.timestamp,
    title: _human(d) + '\n'+d
  }, ''))
}



