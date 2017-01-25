var ref = require('ssb-ref')
var Scroller = require('pull-scroll')
var h = require('hyperscript')
var pull = require('pull-stream')
var u = require('../util')

exports.needs = {
  sbot_user_feed: 'first',
  message_render: 'first',
  avatar_profile: 'first',
  signifier: 'first'
}

exports.gives = 'screen_view'


exports.create = function (api) {

  return function (id) {
    //TODO: header of user info, avatars, names, follows.

    if(ref.isFeed(id)) {

      var content = h('div.column.scroller__content')
      var div = h('div.column.scroller',
        {style: {'overflow':'auto'}},
        h('div.scroller__wrapper',
          h('div', api.avatar_profile(id)),
          h('header', 'Activity'),
          content
        )
      )

      api.signifier(id, function (_, names) {
        if(names.length) div.title = names[0].name
      })


      pull(
        api.sbot_user_feed({id: id, old: false, live: true}),
        Scroller(div, content, api.message_render, true, false)
      )

      //how to handle when have scrolled past the start???

      pull(
        u.next(api.sbot_user_feed, {
          id: id, reverse: true,
          limit: 50, live: false
        }, ['value', 'sequence']),
        // pull.through(console.log.bind(console)),
        Scroller(div, content, api.message_render, false, false)
      )

      return div

    }
  }

}

