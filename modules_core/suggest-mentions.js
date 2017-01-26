
exports.needs = {
  sbot_links2: 'first',
  blob_url: 'first',
  signified: 'first',
  builtin_tabs: 'map',
  avatar_image: 'first'
}

exports.gives = {
  suggest_mentions: true,
  suggest_search: true,
  builtin_tabs: true
}

exports.create = function (api) {

  return {
    suggest_mentions,
    suggest_search,
    builtin_tabs: () => null
  }

  function suggest_mentions (word) {
    return function (cb) {
      if(!/^[%&@]\w/.test(word)) return cb()

      api.signified(word, (err, names) => {
        if(err) return cb(err)

        cb(null, names.map(e => {
          const { name, rank, id } = e
          return {
            title: name,
            // subtitle: `${id.substring(0,10)} (${rank})`,
            subtitle: `(${rank}) ${id.substring(0,10)}`,
            value: '['+name+']('+id+')',
            rank,
            // image: avatar_image(e.id)    //TODO: avatar images...
          }
        }))
      })
    }
  }

  function suggest_search (query) {
    return function (cb) {
      if(/^[@%]\w/.test(query)) {
        api.signified(query, function (_, names) {
          cb(null, names.map(function (e) {
            return {
              title: e.name + ':'+e.id.substring(0, 10),
              value: e.id,
              subtitle: e.rank,
              rank: e.rank
            }
          }))
        })

      } else if(/^\//.test(query)) {
        var tabs = [].concat.apply([], api.builtin_tabs())
        cb(null, tabs.filter(function (name) {
          return name && name.substr(0, query.length) === query
        }).map(function (name) {
          return {
            title: name,
            value: name,
          }
        }))
      } else cb()
    }
  }
}
