var h = require('hyperscript')
var u = require('../util')
var pull = require('pull-stream')
var Scroller = require('pull-scroll')

var plugs = require('../plugs')
var message_render = plugs.first(exports.message_render = [])
var message_compose = plugs.first(exports.message_compose = [])
var sbot_log = plugs.first(exports.sbot_log = [])
var sbot_query = plugs.first(exports.sbot_query = [])
var mfr = require('map-filter-reduce')

exports.message_meta = function (msg) {
  var chan = msg.value.content.channel
  if (chan)
    return h('a', {href: '##'+chan}, '#'+chan)
}

exports.screen_view = function (path) {
  if(path[0] === '#') {
    var channel = path.substr(1)

    var content = h('div.column.scroller__content')
    var div = h('div.column.scroller',
      {style: {'overflow':'auto'}},
      h('div.scroller__wrapper',
        message_compose({type: 'post', channel: channel}),
        content
      )
    )

    function matchesChannel(msg) {
      if (msg.sync) console.error('SYNC', msg)
      var c = msg && msg.value && msg.value.content
      return c && c.channel === channel
    }

    pull(
      sbot_log({old: false}),
      pull.filter(matchesChannel),
      Scroller(div, content, message_render, true, false)
    )

    pull(
      sbot_query({reverse: true, query: [
        {$filter: {value: {content: {channel: channel}}}}
      ]}),
      Scroller(div, content, message_render, false, false)
    )

    return div
  }
}

var channels

var filter = {$filter: {value: {content: {channel: {$gt: ''}}}}}
var map = {$map: {'name': ['value', 'content', 'channel']}}
var reduce = {$reduce: {
  name: 'name',
  rank: {$count: true}
}}

exports.connection_status = function (err) {
  if(err) return

  channels = []

  pull(
    sbot_query({query: [filter, map, reduce]}),
    pull.collect(function (err, chans) {
      if (err) return console.error(err)
      channels = chans.concat(channels)
    })
  )

  pull(
    sbot_log({old: false}),
    mfr.filter(filter),
    mfr.map(map),
    pull.drain(function (chan) {
      var c = channels.find(function (e) {
        return e.name === chan.name
      })
      if (c) c.rank++
      else channels.push(chan)
    })
  )
}

exports.suggest_search = function (query, cb) {
  if(!/^#\w/.test(query)) return cb()
  cb(null, channels.filter(function (chan) {
    return ('#'+chan.name).substring(0, query.length) === query
  })
  .map(function (chan) {
    var name = '#'+chan.name
    return {
      title: name,
      value: name,
      subtitle: chan.rank
    }
  }))
}
