
exports.needs = {
  builtin_tabs: 'map',
  about: {
    signified: 'first',
    image_src: 'first'
  },
  helpers: { blob_url: 'first' },
  sbot: { links2: 'first', }
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

      api.about.signified(word, (err, names) => {
        if(err) return cb(err)

        cb(null, names.map(e => {
          const { name, rank, id } = e
          return {
            title: name,
            subtitle: `(${rank}) ${id.substring(0,10)}`,
            value: '['+name+']('+id+')',
            rank,
            image: api.about.image_src(id),
            showBoth: true
          }
        }))
      })
    }
  }

  function suggest_search (query) {
    return function (cb) {
      if(/^@\w/.test(query)) {
        api.signified(query, (err, names) => {
          if(err) return cb(err)

          cb(null, names.map(e => {
            const { name, rank, id } = e
            return {
              title: name,
              subtitle: `(${rank}) ${id.substring(0,10)}`,
              value: id,
              rank,
              image: api.about_image_src(id),
              showBoth: true
            }
          }))
        })
      } else if (/^%\w/.test(query)) {
        api.signified(query, (err, names) => {
          if(err) return cb(err)

          cb(null, names.map(e => {
            const { name, rank, id } = e
            return {
              title: name,
              subtitle: `(${rank}) ${id.substring(0,10)}`,
              value: id,
              rank
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
