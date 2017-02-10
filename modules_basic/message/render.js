const fs = require('fs')
const h = require('../../h')

exports.needs = {
  about: {
    name: 'first',
    link: 'first'
  },
  message: {
    action: 'map',
    author: 'first',
    backlinks: 'first',
    content: 'first',
    content_mini: 'first',
    title: 'first',
    link: 'first',
    meta: 'map'
  }
}

exports.gives = {
  message: { render: true }
}

exports.create = function (api) {
  return {
    message: {
      render
    }
  }

  function render (msg) {
    var content = api.message.content_mini(msg)
    if (content) return mini(msg, content)

    content = api.message.content(msg)
    if (!content) return mini(msg, message_content_mini_fallback(msg))

    var msgEl = h('Message', {
      'ev-keydown': navigateToMessageOnEnter,
      attributes: {
        tabindex: '0'
      }
    }, [
      h('header.author', api.message.author(msg)),
      h('section.title', api.message.title(msg)),
      h('section.meta', api.message.meta(msg)),
      h('section.content', content),
      h('section.raw-content'),
      h('section.action', api.message.action(msg)),
      h('footer.backlinks', api.message.backlinks(msg))
    ])
    return msgEl

    function navigateToMessageOnEnter (ev) {
      // on enter (or 'o'), hit first meta.
      if(ev.keyCode == 13 || ev.keyCode == 79) {

        // unless in an input
        if (ev.target.nodeName === 'INPUT'
          || ev.target.nodeName === 'TEXTAREA') return

        // HACK! (mw)
        // there's no exported api to open a new tab. :/
        // it's only done in `app.js` module in an`onhashchange` handler.
        // sooooooo yeah this shit for now :)
        var wtf = h('a', { href: `#${msg.key}` })
        msgEl.appendChild(wtf)
        wtf.click()
        msgEl.removeChild(wtf)
      }
    }
  }

  function mini(msg, el) {
    return h('Message -mini', {
      attributes: {
        tabindex: '0'
      }
    }, [
      h('header.author', api.message.author(msg, { size: 'mini' })),
      h('section.meta', api.message.meta(msg)),
      h('section.content', el),
      h('section.raw-content')
    ])
  }
}


function message_content_mini_fallback(msg)  {
  return h('code', msg.value.content.type)
}
