const nest = require('depnest')
const { h } = require('mutant')
const Scroller = require('pull-scroll')
const pull = require('pull-stream')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.thankful': true
})

exports.needs = nest({
  'app.html.scroller': 'first',
  'app.sync.goTo': 'first',
  'keys.sync.id': 'first',
  'channel.obs.subscribed': 'first',
  'contact.obs.following': 'first',
  'sbot.pull.log': 'first',
  'sbot.pull.stream': 'first',
  'message.html.render': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.menuItem': menuItem,
    'app.page.thankful': page
  })

  function menuItem () {
    return h('a', {
      style: { order: 1 },
      'ev-click': () => api.app.sync.goTo({ page: 'thankful' })
    }, '/thankful')
  }

  function getVotes (cb) {
    const myKey = api.keys.sync.id()

    var messages = {}

    return pull(
      api.sbot.pull.stream(server => {
        return server.query.read({
          limit: 10000,
          reverse: true,
          query:
            [{ $filter: {
              value:
                {
                  author: myKey,
                  content: {
                    type: 'vote'
                  }
                }
            } }]
        })
      }),
      pull.drain((msg) => {
        messages[msg.key] = msg
      }, function (err) {
        if (err) throw err

        console.log('Went through ' + Object.keys(messages).length, new Date())

        let msgs = Object.values(messages)

        cb(msgs)
      })
    )
  }

  function page (location) {
    let top = [
      h('button', {
        'ev-click': draw
      }, 'Go!')
    ]

    const { container, content } = api.app.html.scroller({ prepend: top })

    function draw () {
      // reset
      container.scroll(0)
      content.innerHTML = ''

      getVotes((msgs) => {
        console.log('msgs', msgs)

        pull(
          pull.values(msgs),
          Scroller(container, content, api.message.html.render)
        )
      })
    }

    container.title = '/thankful'
    return container
  }
}
