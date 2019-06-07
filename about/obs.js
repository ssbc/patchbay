const { Value } = require('mutant')
const nest = require('depnest')
const { isFeed } = require('ssb-ref')
const gql = require('graphql-tag').default
// var colorHash = new (require('color-hash'))()
// var fallbackImageUrl = 'data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='

exports.needs = nest({
  'about.sync.shortFeedId': 'first',
  'blob.sync.url': 'first',
  'graphql.async.query': 'first'
})

exports.gives = nest({
  'about.obs.name': true,
  'about.obs.imageUrl': true
})

const nameQuery = gql`
  query author($feedId: String!) {
    author(id: $feedId) {
      name
    }
  }
`

exports.create = function (api) {
  var nameCache = {}

  return nest({
    'about.obs.name': name,
    'about.obs.imageUrl': imageUrl
  })

  // TODO !!!
  // add something which watches new about messages coming in and updates any feedId's referenced

  function name (id) {
    if (!isFeed(id)) throw new Error('about.obs.name requires a feedId, got', id)

    if (nameCache[id]) return nameCache[id]

    nameCache[id] = Value(api.about.sync.shortFeedId(id))
    fetchCurrentName(id, (err, res) => {
      if (err) return console.error(JSON.stringify(err, null, 2))

      nameCache[id].set(res.data.author.name)
    })

    return nameCache[id]
  }

  function imageUrl () {
    // returns nothing, so will fall back to original
  }

  function fetchCurrentName (feedId, cb) {
    api.graphql.async.query({ query: nameQuery, variables: { feedId } }, cb)
  }
}
