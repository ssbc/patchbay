const nest = require('depnest')
const { h, Value, when } = require('mutant')
const Abort = require('pull-abortable')
const pull = require('pull-stream')
const addSuggest = require('suggest-box')
const { isFeed } = require('ssb-ref')

exports.gives = nest('app.html.filter')

exports.needs = nest({
  'about.async.suggest': 'first',
  'contact.obs.following': 'first',
  'keys.sync.id': 'first',
  'settings.sync.get': 'first',
  'settings.sync.set': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.filter': Filter
  })

  function Filter (draw) {
    const showFilters = Value(false)

    const myId = api.keys.sync.id()
    const peopleIFollow = api.contact.obs.following(myId)
    const onlyPeopleIFollow = Value(api.settings.sync.get('filter.onlyPeopleIFollow') || false)
    const onlyAuthor = Value()

    const showPost = Value(api.settings.sync.get('filter.showPost') || true)
    const showAbout = Value(api.settings.sync.get('filter.showAbout') || true)
    const showVote = Value(api.settings.sync.get('filter.showVote') || false)
    const showContact = Value(api.settings.sync.get('filter.showContact') || false)
    const showChannel = Value(api.settings.sync.get('filter.showChannel') || false)
    const showPub = Value(api.settings.sync.get('filter.showPub') || false)

    const authorInput = h('input', {
      'ev-keyup': (ev) => {
        const author = ev.target.value
        if (author && !isFeed(author)) return

        onlyAuthor.set(author)
        draw()
      }
    })

    const filterMenu = h('Filter', [
      h('i', {
        classList: when(showFilters, 'fa fa-filter -active', 'fa fa-filter'),
        'ev-click': () => showFilters.set(!showFilters())
      }),
      h('i.fa.fa-angle-up', { 'ev-click': draw }),
      h('div', { className: when(showFilters, '', '-hidden') }, [
        h('header', [
          'Filter',
          h('i.fa.fa-filter')
        ]),
        h('section', [
          h('div.author', [
            h('label', 'Show author'),
            authorInput
          ]),
          toggle({ obs: onlyPeopleIFollow, label: 'Only people I follow' }),
          h('div.message-types', [
            h('header', 'Show messages'),
            toggle({ obs: showPost, label: 'post' }),
            toggle({ obs: showVote, label: 'like' }),
            toggle({ obs: showAbout, label: 'about' }),
            toggle({ obs: showContact, label: 'contact' }),
            toggle({ obs: showChannel, label: 'channel' }),
            toggle({ obs: showPub, label: 'pub' })
          ])
        ])
      ])
    ])

    function toggle ({ obs, label }) {
      return h('FilterToggle', {
        'ev-click': () => {
          obs.set(!obs())

	  if (label == 'Only people I follow')
	    api.settings.sync.set({ filter: { onlyPeopleIFollow: obs() }})
	  else if (label == 'post')
	    api.settings.sync.set({ filter: { showPost: obs() }})
	  else if (label == 'about')
	    api.settings.sync.set({ filter: { showAbout: obs() }})
	  else if (label == 'vote')
	    api.settings.sync.set({ filter: { showVote: obs() }})
	  else if (label == 'contact')
	    api.settings.sync.set({ filter: { showContact: obs() }})
	  else if (label == 'channel')
	    api.settings.sync.set({ filter: { showChannel: obs() }})
	  else if (label == 'pub')
	    api.settings.sync.set({ filter: { showPub: obs() }})

          draw()
        }}, [
          h('label', label),
          h('i', { classList: when(obs, 'fa fa-check-square-o', 'fa fa-square-o') })
        ]
      )
    }

    // NOTE: suggest needs to be added after the input has a parent
    const getProfileSuggestions = api.about.async.suggest()
    addSuggest(authorInput, (inputText, cb) => {
      if (inputText[0] === '@') inputText = inputText.slice(1)
      cb(null, getProfileSuggestions(inputText))
    }, {cls: 'PatchSuggest'})
    authorInput.addEventListener('suggestselect', ev => {
      authorInput.value = ev.detail.id
    })

    function followFilter (msg) {
      if (!onlyPeopleIFollow()) return true

      return Array.from(peopleIFollow()).includes(msg.value.author)
    }

    function authorFilter (msg) {
      if (!onlyAuthor()) return true

      return msg.value.author === onlyAuthor()
    }

    function messageFilter (msg) {
      switch (msg.value.content.type) {
        case 'post':
          return showPost()
        case 'vote':
          return showVote()
        case 'about':
          return showAbout()
        case 'contact':
          return showContact()
        case 'channel':
          return showChannel()
        case 'pub':
          return showPub()
        default:
          return true
      }
    }

    var downScrollAborter

    function filterDownThrough () {
      return pull(
        downScrollAborter,
        pull.filter(followFilter),
        pull.filter(authorFilter),
        pull.filter(messageFilter)
      )
    }

    var upScrollAborter

    function filterUpThrough () {
      return pull(
        upScrollAborter,
        pull.filter(followFilter),
        pull.filter(authorFilter),
        pull.filter(messageFilter)
      )
    }

    function resetFeed ({ container, content }) {
      if (typeof upScrollAborter === 'function') {
        upScrollAborter.abort()
        downScrollAborter.abort()
      }
      upScrollAborter = Abort()
      downScrollAborter = Abort()

      container.scroll(0)
      content.innerHTML = ''
    }

    return {
      filterMenu,
      filterDownThrough,
      filterUpThrough,
      resetFeed
    }
  }
}
