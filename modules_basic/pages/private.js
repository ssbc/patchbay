'use strict'
const fs = require('fs')
const h = require('../../h')
const u = require('../../util')
const pull = require('pull-stream')
const Scroller = require('pull-scroll')
const ref = require('ssb-ref')
const id = require('../../keys').id

function map(ary, iter) {
  if(Array.isArray(ary)) return ary.map(iter)
}

exports.needs = {
  about: { image_link: 'first' },
  message: {
    render: 'first',
    compose: 'first',
    unbox: 'first'
  },
  sbot: {
    log: 'first',
    whoami: 'first'
  },
  helpers: {
    build_scroller: 'first',
    emoji_url: 'first'
  }
}

exports.gives = {
  builtin_tabs: true,
  page: true,
  message: {
    meta: true,
    content_mini: true,
  }
  // mcss: true
}

exports.create = function (api) {

  function unbox () {
    return pull(
      pull.filter(function (msg) {
        return 'string' == typeof msg.value.content
      }),
      pull.map(function (msg) {
        return api.message.unbox(msg)
      }),
      pull.filter(Boolean)
    )
  }

  return {
    builtin_tabs,
    page,
    message: {
      meta,
      content_mini
    },
    // mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
  }

  function builtin_tabs () {
    return ['/private']
  }

  function page (path) {
    if(path !== '/private') return

    var composer = api.message.compose(
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
    var { container, content } = api.helpers.build_scroller({ prepend: composer })

    // if local id is different from sbot id, sbot won't have indexes of
    // private threads
    //TODO: put all private indexes client side.
    api.sbot.whoami(function (err, feed) {
      if (err) return console.error(err)
      if(id !== feed.id)
        return container.appendChild(h('h4',
          'Private messages are not supported in the lite client.'))

      pull(
        u.next(api.sbot.log, {old: false, limit: 100}),
        unbox(),
        Scroller(container, content, api.message.render, true, false)
      )

      pull(
        u.next(api.sbot.log, {reverse: true, limit: 1000}),
        unbox(),
        Scroller(container, content, api.message.render, false, false, function (err) {
          if(err) throw err
        })
      )
    })

    return container
  }

  function meta (msg) {
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
        api.about.image_link('string' == typeof id ? id : id.link)
      )),
      h('div', ']'),
    ])
  }

  function content_mini (msg, sbot)  {
    if (typeof msg.value.content === 'string') {
      var icon = api.helpers.emoji_url('lock')
      return icon
        ? h('img', {className: 'emoji', src: icon})
        : 'PRIVATE'
    }
  }
}

