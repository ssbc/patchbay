var h = require('hyperscript')
var human = require('human-time')

exports.needs = {}

exports.gives = 'message_meta'

exports.create = function () {

  function updateTimestampEl(el) {
    el.firstChild.nodeValue = human(new Date(el.timestamp))
    return el
  }

  setInterval(function () {
    var els = [].slice.call(document.querySelectorAll('.timestamp'))
    els.forEach(updateTimestampEl)
  }, 60e3)

  return function (msg) {
    return updateTimestampEl(h('a.enter.timestamp', {
      href: '#'+msg.key,
      timestamp: msg.value.timestamp,
      title: new Date(msg.value.timestamp)
    }, ''))
  }

}
