const pull = require('pull-stream')
const nest = require('depnest')
const { ApolloClient } = require('apollo-client')
const { InMemoryCache } = require('apollo-cache-inmemory')
const { createHttpLink } = require('apollo-link-http')
const gql = require('graphql-tag').default
// NOTE also depends on graphql module

exports.needs = nest({
  'sbot.pull.stream': 'first'
})
exports.gives = nest('app.sync.initialise')

const mutation = gql`
  mutation process($chunkSize: Int) {
    process(chunkSize: $chunkSize) {
      chunkSize,
      latestSequence
    }
  }
`
exports.create = function (api) {
  return nest('app.sync.initialise', patchql)

  function patchql () {
    if (process.env.PATCHQL === 'false') return

    pull(
      api.sbot.pull.stream(server => {
        return pull.once(server.jsbotPatchql.start())
      }),
      pull.drain((result) => {
      })
    )

    // set up client connection
    const client = new ApolloClient({
      link: createHttpLink({ uri: 'http://localhost:8080/graphql' }), // set by jsbot-patchql
      cache: new InMemoryCache()
    })

    var latestSequence
    var nextSequence
    doProcess()

    function doProcess () {
      client.mutate({ mutation, variables: { chunkSize: 10e3 } })
        .then(res => {
          nextSequence = res.data.process.latestSequence
          if (latestSequence === nextSequence) setTimeout(doProcess, 5e3)
          else {
            latestSequence = nextSequence
            console.log('patchql latestSequence:', latestSequence)
            doProcess()
          }
        })
        .catch(err => {
          console.error(err)
          setTimeout(doProcess, 2e3)
        })
    }
  }
}
