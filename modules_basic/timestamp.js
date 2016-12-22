var fs = require('fs')
var Path = require('path')
var h = require('../h')
var human = require('human-time')

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
    mcss: () => fs.readFileSync(Path.join(__dirname, 'timestamp.mcss'))
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
