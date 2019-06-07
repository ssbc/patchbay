const pull = require('pull-stream')
const nest = require('depnest')
const { ApolloClient } = require('apollo-client')
const { InMemoryCache } = require('apollo-cache-inmemory')
const { createHttpLink } = require('apollo-link-http')
const gql = require('graphql-tag').default
// NOTE also depends on graphql module

exports.needs = nest({
  'sbot.async.run': 'first'
})
exports.gives = nest({
  'app.sync.initialise': true,
  'graphql.async.query': true
})

const mutation = gql`
  mutation process($chunkSize: Int) {
    process(chunkSize: $chunkSize) {
      chunkSize,
      latestSequence
    }
  }
`
exports.create = function (api) {
  var graphql

  return nest({
    'app.sync.initialise': startPatchql,
    'graphql.async.query': graphQuery
  })

  function startPatchql () {
    if (process.env.PATCHQL === 'false') return

    graphql = GraphqlClient()

    var latestSequence
    var nextSequence

    api.sbot.async.run(server => {
      server.jsbotPatchql.start({}, () => {
        indexLoop()
      })
    })

    function indexLoop () {
      graphql.mutate({ mutation, variables: { chunkSize: 10e3 } })
        .then(res => {
          nextSequence = res.data.process.latestSequence
          if (latestSequence === nextSequence) setTimeout(indexLoop, 5e3)
          else {
            latestSequence = nextSequence
            console.log('patchql latestSequence:', latestSequence)
            indexLoop()
          }
        })
        .catch(err => {
          console.error(err)
          return setTimeout(indexLoop, 2e3)
        })
    }
  }

  function graphQuery ({ query, variables }, cb) {
    if (!graphql) return setTimeout(() => graphQuery({ query, variables }, cb), 1e3)

    graphql.query({ query, variables })
      .then(res => cb(null, res))
      .catch(err => cb(err))
  }

  function GraphqlClient () {
    return new ApolloClient({
      link: createHttpLink({ uri: 'http://localhost:8080/graphql' }), // set by jsbot-patchql
      cache: new InMemoryCache()
    })
  }
}
