const nest = require('depnest')
const { h, Value, when, computed } = require('mutant')
const Abort = require('pull-abortable')
const pull = require('pull-stream')
const addSuggest = require('suggest-box')
const { isFeed } = require('ssb-ref')
const some = require('lodash/some')
const get = require('lodash/get')
const isEqual = require('lodash/isEqual')

exports.gives = nest('app.html.filter')

exports.needs = nest({
  'about.async.suggest': 'first',
  'contact.obs.following': 'first',
  'keys.sync.id': 'first',
  'settings.obs.get': 'first',
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

    const { set } = api.settings.sync

    const onlyAuthor = Value()

    const filterSettings = api.settings.obs.get('filter')

    // this needs to show if the filter has changed from default ?...?
    const isFiltered = computed([onlyAuthor, filterSettings], (onlyAuthor, filterSettings) => {
	return onlyAuthor || filterSettings.only.peopleIFollow || !isEqual(filterSettings.show, filterSettings.defaults.show)
    })

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
        classList: when(showFilters, 
          'fa fa-filter -active',
          when(isFiltered, 'fa fa-filter -filtered', 'fa fa-filter')
        ),
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
          toggle({ type: 'peopleIFollow', filterGroup: 'only', label: 'Only people I follow' }),
          h('div.message-types', [
            h('header', 'Show messages'),
            toggle({ type: 'post' }),
            toggle({ type: 'like' }),
            toggle({ type: 'about' }),
            toggle({ type: 'contact' }),
            toggle({ type: 'channel' }),
            toggle({ type: 'pub' }),
            toggle({ type: 'chess' })
          ])
        ])
      ])
    ])

    function toggle ({ type, filterGroup, label }) {
      label = label || type
      filterGroup = filterGroup || 'show'

      const state = computed(filterSettings, settings => get(settings, [filterGroup, type]))
      const handleClick = () => {
        const currentState = state()

        //TODO use some lodash tool ?
        api.settings.sync.set({ 
          filter: {
            [filterGroup]: {
              [type]: !currentState
            }
          }
        })

        draw()
      }

      return h('FilterToggle', { 'ev-click': handleClick }, [
        h('label', label),
        h('i', { classList: when(state, 'fa fa-check-square-o', 'fa fa-square-o') })
      ])
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
      if (!filterSettings().only.peopleIFollow) return true

      return Array.from(peopleIFollow()).includes(msg.value.author)
    }

    function authorFilter (msg) {
      if (!onlyAuthor()) return true

      return msg.value.author === onlyAuthor()
    }

    function messageFilter (msg) {
      var { type } = msg.value.content
      if (/^chess/.test(type)) {
        type = 'chess'
      }

      return get(filterSettings(), ['show', type], true)
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
