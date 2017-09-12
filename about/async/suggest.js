var nest = require('depnest')
var { h, Struct, map, concat, dictToCollection, computed, lookup, watch, keys, resolve } = require('mutant')

var KEY_SAMPLE_LENGTH = 10 // includes @

exports.gives = nest('about.async.suggest')

exports.needs = nest({
  'about.obs.groupedValues': 'first',
  'about.obs.name': 'first',
  'about.obs.names': 'first',
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

      wordLower = word.toLowerCase()
      const nameMatches = suggestions()
        .filter(item => {
          // if (item.title) return ~item.title.toLowerCase().indexOf(wordLower)
          if (item._name) return ~item._name.toLowerCase().indexOf(wordLower)
          return ~item.subtitle.toLowerCase().indexOf(wordLower)
        })


      return nameMatches
        .sort((a, b) => { // sort primary aliases to top
          if (a._name.indexOf(word) === 0) return -1
          if (b._name.indexOf(word) === 0) return +1

          if (a._name.toLowerCase().indexOf(word) === 0) return -1
          if (b._name.toLowerCase().indexOf(word) === 0) return +1
        })
        .sort((a, b) => {  // sort into blocks of id
          if (a.id === b.id) return 0
          if (a.id > b.id) return -1
          if (a.id < b.id) return +1
        })
        .reduce((sofar, match) => {
          // prune to the first instance of each id
          // this presumes if you were typing e.g. "dino" you don't need "ahdinosaur" as well
          if (sofar.find(el => el.id === match.id)) return sofar

          return [...sofar, match]
        }, [])
        // .sort((a, b) => {  // sort isTopAlias avatar to top
        //   if (a.id !== b.id) return 0
        //   if (a.image) return -1
        //   if (b.image)  return +1
        // })
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

    return computed([api.about.obs.name(id)], myNameForThem => {
      return map(item.value, name => {
        const isTopAlias = name === myNameForThem
        const names = item.value()

        const aliases = names
          .filter(n => n != name)
          .map(name => h('div.alias', 
            { className: name === myNameForThem ? '-bold' : '' },
            name
          ))

        return Struct({
          id,
          title: name,
          subtitle: [
            h('div.aliases', aliases),
            h('div.key', id.substring(0, KEY_SAMPLE_LENGTH))
          ],
          value: mention(name, id),
          image: api.about.obs.imageUrl(id),
          showBoth: true,
          _name: name // TODO change code above if not needed
        })
      })
    })

  }

  // feeds recentSuggestions
  function suggestion (id) {
    var name = api.about.obs.name(id)
    return Struct({
      id,
      title: name,
      subtitle: h('div.key', id.substring(0, KEY_SAMPLE_LENGTH)),
      value: computed([name, id], mention),
      image: api.about.obs.imageUrl(id),
      showBoth: true
    })
  }
}

function mention (name, id) {
  return `[@${name}](${id})`
}
