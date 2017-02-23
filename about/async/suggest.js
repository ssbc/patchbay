var nest = require('depnest')
var { Struct, map, computed, watch } = require('mutant')

exports.gives = nest('about.async.suggest')

exports.needs = nest({
  'about.obs': {
    name: 'first',
    imageUrl: 'first'
  },
  'contact.obs.following': 'first',
  'feed.obs.recent': 'first',
  'keys.sync.id': 'first'
})

exports.create = function (api) {
  var suggestions = null
  var recentSuggestions = null

  return nest('about.async.suggest', function () {
    loadSuggestions()
    return function (word) {
      if (!word) {
        return recentSuggestions()
      } else {
        return suggestions().filter((item) => {
          return item.title.toLowerCase().startsWith(word.toLowerCase())
        })
      }
    }
  })

  function loadSuggestions () {
    if (!suggestions) {
      var id = api.keys.sync.id()
      var following = api.contact.obs.following(id)
      var recentlyUpdated = api.feed.obs.recent()
      var contacts = computed([following, recentlyUpdated], function (a, b) {
        var result = Array.from(a)
        b.forEach((item, i) => {
          if (!result.includes(item)) {
            result.push(item)
          }
        })
        return result
      })

      recentSuggestions = map(computed(recentlyUpdated, (items) => Array.from(items).slice(0, 10)), suggestion, {idle: true})
      suggestions = map(contacts, suggestion, {idle: true})
      watch(recentSuggestions)
      watch(suggestions)
    }
  }

  function suggestion (id) {
    var name = api.about.obs.name(id)
    return Struct({
      title: name,
      id,
      subtitle: id.substring(0, 10),
      value: computed([name, id], mention),
      image: api.about.obs.imageUrl(id),
      showBoth: true
    })
  }
}

function mention (name, id) {
  return `[@${name}](${id})`
}

