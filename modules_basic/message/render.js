const fs = require('fs')
const pull = require('pull-stream')
const u = require('../../util')
const h = require('../../h')

exports.needs = {
  avatar_name: 'first',
  avatar_link: 'first',
  message_action: 'map',
  message_author: 'first',
  message_backlinks: 'first',
  message_content: 'first',
  message_content_mini: 'first',
  message_title: 'first',
  message_link: 'first',
  message_meta: 'map',
}

exports.gives = {
  message_render: true,
  mcss: true
}

exports.create = function (api) {
  return {
    message_render,
    mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
  }

  function message_render (msg) {
    var content = api.message_content_mini(msg)
    if (content) return mini(msg, content)

    content = api.message_content(msg)
    if (!content) return mini(msg, message_content_mini_fallback(msg))

    var msgEl = h('Message', {
      'ev-keydown': navigateToMessageOnEnter,
      attributes: {
        tabindex: '0'
      }
    }, [
      h('header.author', api.message_author(msg)),
      h('section.title', api.message_title(msg)),
      h('section.meta', api.message_meta(msg)),
      h('section.content', content),
      h('section.action', api.message_action(msg)),
      h('footer.backlinks', api.message_backlinks(msg))
    ])
    return msgEl

    function navigateToMessageOnEnter (ev) {
      // on enter, hit first meta.
      if(ev.keyCode == 13) {

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
      h('header.author', api.message_author(msg, { size: 'mini' })),
      h('section.meta', api.message_meta(msg)),
      h('section.content', el)
    ])
  }
}


function message_content_mini_fallback(msg)  {
  return h('code', msg.value.content.type)
}

