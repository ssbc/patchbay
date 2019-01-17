const nest = require('depnest')
const { onceTrue } = require('mutant')

var fallbackImageUrl = 'data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='

exports.gives = nest('about.async.suggest')

exports.needs = nest({
  'blob.sync.url': 'first',
  'sbot.obs.connection': 'first'
})

exports.create = function (api) {
  return nest('about.async.suggest', suggestedProfile)

  // TODO rework this top API!
  function suggestedProfile (text, defaultIds, cb) {
    if (cb === undefined && typeof defaultIds === 'function') return suggestedProfile(text, [], defaultIds)

    onceTrue(api.sbot.obs.connection, ssb => {
      ssb.suggest.profile({ text, defaultIds, limit: 20 }, (err, items) => {
        if (err) return cb(err)

        cb(null, items.map(Suggestion))
      })
    })

    return true // stop at this depject
  }

  function Suggestion (item) {
    return {
      title: item.name,
      id: item.id,
      subtitle: item.id.substring(0, 10),
      value: `[@${item.name}](${item.id})`,
      cls: item.following ? 'following' : null,
      image: item.image ? api.blob.sync.url(item.image) : fallbackImageUrl,
      showBoth: true
    }
  }
}
