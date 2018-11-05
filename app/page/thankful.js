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
  'sbot.async.get': 'first',
  'message.html.render': 'first',
  'about.html.image': 'first'
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

  function getVotes (resultCb) {
    const myKey = api.keys.sync.id()

    const sinceDate = new Date().setMonth(new Date().getMonth() - 1)

    return pull(
      api.sbot.pull.stream(server => {
        return server.query.read({
          limit: 10000,
          reverse: true,
          query:
          // Gets all votes/likes made by you in the last month
            [{ $filter: {
              value:
                {
                  timestamp: {
                    $gt: sinceDate
                  },
                  author: myKey,
                  content: {
                    type: 'vote'
                  }
                }
            } },
            {
              // Extracts the liked post's link
              $map: ['value', 'content', 'vote', 'link']
            }
            ]
        })
      }),
      pull.asyncMap((postLink, mapCb) => {
        // Gets the post that the link points to
        api.sbot.async.get(postLink, (err, post) => {
          if (err) console.error('asyncMap error', err)
          // And extracts the author of it
          mapCb(null, post.author)
        })
      }),
      pull.collect((err, likeList) => {
        if (err) console.error(err)

        const authorLikes = {}

        likeList.forEach(author => {
          if (authorLikes[author] === undefined) {
            authorLikes[author] = 1
          } else {
            authorLikes[author]++
          }
        })

        resultCb(null, Object.keys(authorLikes).map(author => {
          return { author: author, likes: authorLikes[author] }
        }).sort((a, b) => b.likes - a.likes))
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

      getVotes((err, authorLikes) => {
        if (err) console.error(err)

        pull(
          pull.values(authorLikes),
          Scroller(container, content, text => h('p', [api.about.html.image(text.author), text.likes]))
        )
      })
    }

    container.title = '/thankful'
    return container
  }
}
