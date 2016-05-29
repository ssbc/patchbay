var ref = require('ssb-ref')
var ui = require('../ui')
var Scroller = require('pull-scroll')

var plugs = require('../plugs')
var sbot_user_feed = plugs.first(exports.sbot_user_feed = [])
var message_render = plugs.first(exports.message_render = [])

exports.screen_view = function (id, sbot) {
  //TODO: header of user info, avatars, names, follows.

  if(ref.isFeed(id)) {
    return ui.createStream(
      sbot_user_feed({id: id, reverse: true}),
      message_render
    )
  }
}


