var fs = require('fs')
var Path = require('path')
var pull = require('pull-stream')
var u = require('../util')
var h = require('../h')

exports.needs = {
  avatar_name: 'first',
  avatar_link: 'first',
  message_meta: 'first',
  message_header: 'first',
  message_content: 'first',
  message_content_mini: 'first',
  message_footer: 'first'
}

exports.gives = {
  message_render: true,
  mcss: true
}

exports.create = function (api) {
  return {
    message_render,
    mcss: () => fs.readFileSync(Path.join(__dirname, 'message.mcss'))
  }

  function message_render (msg, sbot) {
    var content = api.message_content_mini(msg)
    //if(content) return mini(msg, content)

    var content = api.message_content(msg)
    if(!content) return mini(msg, message_content_mini_fallback(msg))

    var msgEl = h('Message', {
      'ev-keydown': navigateToMessageOnEnter
    }, [
      h('header', api.message_header(msg)),
      h('section -content', content),
      h('footer', api.message_footer(msg))
    ])

    // ); hyperscript does not seem to set attributes correctly.
    msgEl.setAttribute('tabindex', '0')

    return msgEl

    function navigateToMessageOnEnter (ev) {
      //on enter, hit first meta.
      if(ev.keyCode == 13) {

        // unless in an input
        if (ev.target.nodeName === 'INPUT'
          || ev.target.nodeName === 'TEXTAREA') return

        // HACK!
        // there's no exported api to open a new tab. :/
        // it's only done in `app.js` module in an`onhashchange` handler.
        // sooooooo yeah this shit:
        var wtf = h('a', { href: `#${msg.key}` })
        msgEl.appendChild(wtf)
        wtf.click()
      }
    }
  }

  function mini(msg, el) {
    var div = h('div.message.message--mini', [
      h('div.row', [
        h('div', [
          api.avatar_link(msg.value.author, api.avatar_name(msg.value.author)),
          h('span.message_content', el)
        ]),
        h('div.message_meta.row', api.message_meta(msg))
      ])
    ])
    div.setAttribute('tabindex', '0')
    return div
  }
}


function message_content_mini_fallback(msg)  {
  return h('code', msg.value.content.type)
}
