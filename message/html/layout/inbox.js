const nest = require('depnest')
const { h, Value } = require('mutant')

exports.needs = nest({
  'about.html.avatar': 'first',
  'keys.sync.id': 'first',
  'message.html': {
    backlinks: 'first',
    author: 'first',
    markdown: 'first',
    meta: 'map',
    timestamp: 'first'
  }
})

exports.gives = nest('message.html.layout')

exports.create = (api) => {
  return nest('message.html.layout', inboxLayout)

  function inboxLayout (msgRollup, { layout, content } = {}) {
    if (layout !== 'inbox') return

    var rawMessage = Value(null)

    const { timestamp, author, meta } = api.message.html
    const { avatar } = api.about.html

    const msgCount = msgRollup.replies.length + 1
    const rootMsg = msgRollup
    const newMsg = getNewestMsg(msgRollup)
    const rootAuthor = rootMsg.value.author
    const others = msgRollup.value.content.recps
      .map(recp => {
        // TODO check these things are feed links!!! 
        if (typeof recp === 'string') return recp

        if (recp.link) return recp.link
      })
      .filter(Boolean)
      .filter(id => id !== rootAuthor)

    const myId = api.keys.sync.id()
    const showNewMsg = newMsg && newMsg.value.author !== myId

    // TODO : MCSS styling ... actual design
    return h('Message -inbox', {
      attributes: {
        tabindex: '0'
      }
    }, [
      // h('section.timestamp', {}, timestamp(newMsg)),
      h('section.avatar', {}, avatar(rootAuthor)),
      // h('section.meta', {}, meta(msg, { rawMessage })),
      h('section.content', {}, content),
      h('section.count', { style: { padding: '5px' } }, ` (${msgCount}) `),
      h('section.others', { stlye: { height: 35 }}, others.map(avatar)),
      showNewMsg 
        ? h('section.content', { style: { background: '#f4f4f4' } }, [
          'MOST RECENT REPLY: ',
          messageContent(newMsg)
        ]) 
        : '',
      h('section.raw-content', rawMessage)
    ])
  }

  function messageContent (msg) {
    if (!msg.value.content || !msg.value.content.text) return
    return h('div', {}, api.message.html.markdown(msg.value.content))
  }
}

function getNewestMsg (msg) {
  if (!msg.replies || msg.replies.length === 0) return

  return msg.replies[msg.replies.length - 1]
}

