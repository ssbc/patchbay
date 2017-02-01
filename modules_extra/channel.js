var h = require('hyperscript')
var pull = require('pull-stream')
var Scroller = require('pull-scroll')
var mfr = require('map-filter-reduce')

exports.needs = {
  build_scroller: 'first',
  message_render: 'first',
  message_compose: 'first',
  sbot_log: 'first',
  sbot_query: 'first',
}

exports.gives = {
  message_meta: true, screen_view: true,
  connection_status: true, suggest_search: true
}

exports.create = function (api) {

  var channels

  var filter = {$filter: {value: {content: {channel: {$gt: ''}}}}}
  var map = {$map: {'name': ['value', 'content', 'channel']}}
  var reduce = {$reduce: {
    name: 'name',
    rank: {$count: true}
  }}

  return {
    message_meta: function (msg) {
      var chan = msg.value.content.channel
      if (chan)
        return h('a', {href: '##'+chan}, '#'+chan)
    },
    screen_view: function (path) {
      if(path[0] === '#') {
        var channel = path.substr(1)

        var composer = api.message_compose({type: 'post', channel: channel})
        var { container, content } = api.build_scroller({ prepend: composer })

        function matchesChannel(msg) {
          if (msg.sync) console.error('SYNC', msg)
          var c = msg && msg.value && msg.value.content
          return c && c.channel === channel
        }

        pull(
          api.sbot_log({old: false}),
          pull.filter(matchesChannel),
          Scroller(container, content, api.message_render, true, false)
        )

        pull(
          api.sbot_query({reverse: true, query: [
            {$filter: {value: {content: {channel: channel}}}}
          ]}),
          Scroller(container, content, api.message_render, false, false)
        )

        return container
      }
    },

    connection_status: function (err) {
      if(err) return

      channels = []

      pull(
        api.sbot_query({query: [filter, map, reduce]}),
        pull.collect(function (err, chans) {
          if (err) return console.error(err)
          channels = chans.concat(channels)
        })
      )

      pull(
        api.sbot_log({old: false}),
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
    },

    suggest_search: function (query) {
      return function (cb) {
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
    }
  }
}

