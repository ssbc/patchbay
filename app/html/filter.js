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
  'keys.sync.id': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.filter': Filter
  })

  function Filter (draw) {
    const showFilters = Value(false)

    const myId = api.keys.sync.id()
    const peopleIFollow = api.contact.obs.following(myId)
    const onlyPeopleIFollow = Value(false)
    const onlyAuthor = Value()

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
      h('div', { className: when(showFilters, '', '-hidden') }, [
        h('header', [
          'Filter',
          h('i.fa.fa-filter')
        ]),
        h('section', [
          h('div', {
            'ev-click': () => {
              onlyPeopleIFollow.set(!onlyPeopleIFollow())
              draw()
            }}, [
              h('label', 'only people i follow'),
              h('i', { classList: when(onlyPeopleIFollow, 'fa fa-check-square-o', 'fa fa-square-o') })
            ]
          ),
          h('div', [
            h('label', 'only author'),
            authorInput
          ]),
          h('div', { 'ev-click': draw }, [
            h('label', 'refresh'),
            h('i.fa.fa-refresh')
          ])
        ])
      ])
    ])

    // NOTE: suggest needs to be added after the input has a parent
    const getProfileSuggestions = api.about.async.suggest()
    addSuggest(authorInput, (inputText, cb) => {
      if (inputText[0] === '@') inputText = inputText.slice(1)
      cb(null, getProfileSuggestions(inputText))
    }, {cls: 'SuggestBox'})
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

    var downScrollAborter

    function filterDownThrough () {
      return pull(
        downScrollAborter,
        pull.filter(followFilter),
        pull.filter(authorFilter)
      )
    }

    var upScrollAborter

    function filterUpThrough () {
      return pull(
        upScrollAborter,
        pull.filter(followFilter),
        pull.filter(authorFilter)
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

