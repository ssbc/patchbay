var ref = require('ssb-ref')
var ui = require('../ui')
var Scroller = require('pull-scroll')
var h = require('hyperscript')
var pull = require('pull-stream')
var u = require('../util')

var plugs = require('../plugs')
var sbot_user_feed = plugs.first(exports.sbot_user_feed = [])
var message_render = plugs.first(exports.message_render = [])
var avatar_profile = plugs.first(exports.avatar_profile = [])

exports.screen_view = function (id, sbot) {
  //TODO: header of user info, avatars, names, follows.

  if(ref.isFeed(id)) {

    var content = h('div.column.scroller__content')
    var div = h('div.column.scroller',
      {style: {'overflow':'auto'}},
      h('div.scroller__wrapper',
        h('div', avatar_profile(id)),
        content
      )
    )

    pull(
      sbot_user_feed({id: id, old: false, live: true}),
      Scroller(div, content, message_render, true, false)
    )

    //how to handle when have scrolled past the start???

    pull(
      u.next(sbot_user_feed, {
        id: id, reverse: true,
        limit: 50, live: false
      }, ['value', 'sequence']),
      Scroller(div, content, message_render, false, false)
    )

    return div

  }
}







