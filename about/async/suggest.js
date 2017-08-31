var nest = require('depnest')
var { Struct, map, concat, dictToCollection, computed, lookup, watch, keys, resolve } = require('mutant')

exports.gives = nest('about.async.suggest')

exports.needs = nest({
  'about.obs.groupedValues': 'first',
  'about.obs.name': 'first',
  'about.obs.imageUrl': 'first',
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
      if (!word) return recentSuggestions()

      return suggestions()
        .filter((item) => {
          return item.title.toLowerCase().startsWith(word.toLowerCase())
        })
        .reverse()
    }
  }

  function loadSuggestions () {
    if (suggestions) return

    var id = api.keys.sync.id()
    var following = api.contact.obs.following(id)
    var recentlyUpdated = api.feed.obs.recent()
    var contacts = computed([following, recentlyUpdated], (a, b) => {
      var result = new Set(a)
      b.forEach(item => result.add(item))

      return Array.from(result)
    })

    recentSuggestions = map(
      computed(recentlyUpdated, (items) => Array.from(items).slice(0, 10)),
      suggestion,
      {idle: true}
    )

    const suggestionsRecord = lookup(contacts, contact => {
      return [contact, keys(api.about.obs.groupedValues(contact, 'name'))]
    })

    suggestions = concat(
      map(dictToCollection(suggestionsRecord), pluralSuggestions, {idle: true})
    )

    watch(recentSuggestions)
    watch(suggestions)
  }

  function pluralSuggestions (item) {
    const id = resolve(item.key)
    return map(item.value, name => {
      return Struct({
        id,
        title: name,
        subtitle: subtitle(id, name),
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

  function subtitle (id, name) {
    return computed([api.about.obs.name(id)], commonName => {
      return name.toLowerCase() === commonName.toLowerCase()
        ? id.substring(0, 10)
        : `${commonName} ${id.substring(0, 10)}`
    })
  }
}

function mention (name, id) {
  return `[@${name}](${id})`
}
