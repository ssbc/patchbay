var nest = require('depnest')
var { Struct, map, concat, dictToCollection, computed, watch } = require('mutant')

exports.gives = nest('about.async.suggest')

exports.needs = nest({
  'about.obs': {
    name: 'first',
    names: 'first',
    imageUrl: 'first'
  },
  'contact.obs.following': 'first',
  'feed.obs.recent': 'first',
  'keys.sync.id': 'first'
})

exports.create = function (api) {
  var suggestions = null
  var recentSuggestions = null

  return nest('about.async.suggest', suggest)

  function suggest () {
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
  }

  function loadSuggestions () {
    if (suggestions) return

    var id = api.keys.sync.id()
    var following = api.contact.obs.following(id)
    var recentlyUpdated = api.feed.obs.recent()
    var contacts = computed([following, recentlyUpdated], (a, b) => {
      var result = Array.from(a)
      b.forEach(item => {
        if (!result.includes(item)) {
          result.push(item)
        }
      })
      return result
    })

    recentSuggestions = map(
      computed(recentlyUpdated, (items) => Array.from(items).slice(0, 10)),
      suggestion,
      {idle: true}
    )

    const suggestionsRecord = computed(contacts, contacts => {
      var result = {}
      contacts.forEach(contact => {
        result[contact] = api.about.obs.names(contact)
      })

      return result
    })

    const mapableSuggestions = dictToCollection(suggestionsRecord)
    suggestions = concat(
      map(mapableSuggestions, pluralSuggestions, {idle: true})
    )

    watch(recentSuggestions)
    watch(suggestions)
  }


  function pluralSuggestions (item) {
    const { key, value } = item

    const id = key()
    const names = computed(value, v => Object.keys(v))

    return map(names, name => {
      const subtitle = computed([api.about.obs.name(id)], commonName => {
        return name.toLowerCase() === commonName.toLowerCase()
          ? id.substring(0, 10)
          : `${commonName} ${id.substring(0, 10)}`
      })

      return Struct({
        title: name,
        id,
        subtitle,
        value: computed([name, id], mention),
        image: api.about.obs.imageUrl(id),
        showBoth: true
      })
    })
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

