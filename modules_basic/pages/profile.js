const ref = require('ssb-ref')
const Scroller = require('pull-scroll')
const fs = require('fs')
const pull = require('pull-stream')
const h = require('../../h')
const u = require('../../util')

exports.needs = {
  about_edit: 'first',
  build_scroller: 'first',
  sbot_user_feed: 'first',
  message_render: 'first',
  contact_relationships: 'first',
  signifier: 'first'
}

exports.gives = {
  screen_view: true,
  mcss: true
}

exports.create = function (api) {
  return {
    screen_view,
    mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
  }

  function screen_view (id) {
    //TODO: header of user info, avatars, names, follows.

    if(!ref.isFeed(id)) return


    const profile =  h('Profile', [
      h('section.edit', api.about_edit(id)),
      h('section.relationships', api.contact_relationships(id)),
      h('section.activity', [
        h('header', 'Activity')
        // ideally the scroller content would go in here
      ])
    ])

    var { container, content } = api.build_scroller({ prepend: profile })
          
    api.signifier(id, function (_, names) {
      if(names.length) container.title = names[0].name
    })
    container.id = id

    pull(
      api.sbot_user_feed({id: id, old: false, live: true}),
      Scroller(container, content, api.message_render, true, false)
    )

    //how to handle when have scrolled past the start???

    pull(
      u.next(api.sbot_user_feed, {
        id: id, reverse: true,
        limit: 50, live: false
      }, ['value', 'sequence']),
      // pull.through(console.log.bind(console)),
      Scroller(container, content, api.message_render, false, false)
    )

    return container
  }
}

