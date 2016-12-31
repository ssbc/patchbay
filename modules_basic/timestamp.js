const getStyleForModule = require('../get-style-for-module') 
const h = require('../h')
const human = require('human-time')

exports.needs = {}

exports.gives = {
  timestamp: true,
  mcss: true
}

exports.create = function () {
  setInterval(function () {
    var els = [].slice.call(document.querySelectorAll('.Timestamp'))
    els.forEach(updateTimestampEl)
  }, 60e3)

  return {
    timestamp,
    mcss: getStyleForModule(__filename)
  }

  function updateTimestampEl (el) {
    var timestamp = Number(el.getAttribute('data-timestamp'))
    var display = human(new Date(timestamp))
    el.querySelector('a').firstChild.nodeValue = display
    return el
  }

  function timestamp (msg) {
    var { key, value } = msg
    var { timestamp } = value
    var el = h('Timestamp', {
      attributes: {
        'data-timestamp': timestamp
      }
    }, [
      h('a', {
        href: `#${key}`,
        title: new Date(timestamp)
      }, '')
    ])
    updateTimestampEl(el)
    return el
  }
}
