'use strict'
const fs = require('fs')
const h = require('../h')
const u = require('../util')
const pull = require('pull-stream')
const Scroller = require('pull-scroll')
const ref = require('ssb-ref')

function map(ary, iter) {
  if(Array.isArray(ary)) return ary.map(iter)
}

exports.needs = {
  build_scroller: 'first',
  message_render: 'first',
  message_compose: 'first',
  message_unbox: 'first',
  sbot_log: 'first',
  sbot_whoami: 'first',
  avatar_image_link: 'first',
  emoji_url: 'first'
}

exports.gives = {
  builtin_tabs: true,
  screen_view: true,
  message_meta: true,
  message_content_mini: true,
  // mcss: true
}

exports.create = function (api) {

  function unbox () {
    return pull(
      pull.filter(function (msg) {
        return 'string' == typeof msg.value.content
      }),
      pull.map(function (msg) {
        return api.message_unbox(msg)
      }),
      pull.filter(Boolean)
    )
  }

  return {
    builtin_tabs,
    screen_view,
    message_meta,
    message_content_mini,
    // mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
  }

  function builtin_tabs () {
    return ['/private']
  }

  function screen_view (path) {
    if(path !== '/private') return

    var composer = api.message_compose(
      {type: 'post', recps: [], private: true},
      {
        prepublish: function (msg) {
          msg.recps = [id].concat(msg.mentions).filter(function (e) {
            return ref.isFeed('string' === typeof e ? e : e.link)
          })
          if(!msg.recps.length)
            throw new Error('cannot make private message without recipients - just mention the user in an at reply in the message you send')
          return msg
        },
        placeholder: 'Write a private message'
      }
    )
    var { container, content } = api.build_scroller({ prepend: composer })

    // if local id is different from sbot id, sbot won't have indexes of
    // private threads
    //TODO: put all private indexes client side.
    var id = require('../keys').id
    api.sbot_whoami(function (err, feed) {
      if (err) return console.error(err)
      if(id !== feed.id)
        return container.appendChild(h('h4',
          'Private messages are not supported in the lite client.'))

      pull(
        u.next(api.sbot_log, {old: false, limit: 100}),
        unbox(),
        Scroller(container, content, api.message_render, true, false)
      )

      pull(
        u.next(api.sbot_log, {reverse: true, limit: 1000}),
        unbox(),
        Scroller(container, content, api.message_render, false, false, function (err) {
          if(err) throw err
        })
      )
    })

    return container
  }

  function message_meta (msg) {
    if(!msg.value.content.recps && ! msg.value.private) return

    return h('div', {
      style: {
        display: 'flex',
        'align-items': 'center',
        color: 'gray'
      }
    }, [
      h('div', 'private: ['),
      map(msg.value.content.recps, id => (
        api.avatar_image_link('string' == typeof id ? id : id.link)
      )),
      h('div', ']'),
    ])
  }

  function message_content_mini (msg, sbot)  {
    if (typeof msg.value.content === 'string') {
      var icon = api.emoji_url('lock')
      return icon
        ? h('img', {className: 'emoji', src: icon})
        : 'PRIVATE'
    }
  }
}

