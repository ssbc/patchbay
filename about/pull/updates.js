const nest = require('depnest')
const pull = require('pull-stream')
const Notify = require('pull-notify')
const { isMsg, isFeed } = require('ssb-ref')

exports.gives = nest('about.pull.updates')

exports.needs = nest({
  'keys.sync.id': 'first',
  'message.obs.likes': 'first',
  'sbot.pull.stream': 'first'
})

exports.create = (api) => {
  const cache = {}
  var listening = false

  return nest('about.pull.updates', updates)

  function updates (key) {
    if (!(isMsg(key) || isFeed(key))) throw new Error(`about.pull.updates expects a valid message/ feed key, got ${key}`)
    startListening()

    if (!cache[key]) cache[key] = Notify()
    return cache[key].listen()
  }

  function startListening () {
    if (listening) return

    const opts = {
      live: true,
      old: false,
      query: [{
        $filter: {
          value: {
            timestamp: { $gt: 0 },
            content: {
              type: 'about',
              about: { $truthy: true }
            }
          }
        }
      }, {
        $map: {
          about: ['value', 'content', 'about']
        }
      }]
    }
    pull(
      api.sbot.pull.stream(server => server.query.read(opts)),
      pull.filter(m => !m.sync),
      pull.drain(
        ({ about }) => {
          if (!cache[about]) return

          cache[about](1) // emit a minimal update!
        },
        (err) => console.error(err)
      )
    )

    listening = true
  }
}
