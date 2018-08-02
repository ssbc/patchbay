const nest = require('depnest')
const { h, Struct, Value } = require('mutant')
const pull = require('pull-stream')
const next = require('pull-next-query')
const Scroller = require('pull-scroll')
const TextNodeSearcher = require('text-node-searcher')

exports.gives = nest('app.page.search')

exports.needs = nest({
  'app.html.filter': 'first',
  'app.html.scroller': 'first',
  'message.html.render': 'first',
  'sbot.pull.log': 'first',
  'sbot.pull.stream': 'first'
})

var whitespace = /\s+/

exports.create = function (api) {
  return nest('app.page.search', searchPage)

  function searchPage (location) {
    const query = location.query.trim()

    const search = Struct({
      fulltext: Struct({
        isDone: Value(false)
      }),
      matches: Value(0)
    })

    const searchHeader = h('Search', [
      h('header', h('h1', query))
    ])
    const { filterMenu, filterDownThrough, resetFeed } = api.app.html.filter(draw)
    const { container, content } = api.app.html.scroller({ prepend: [searchHeader, filterMenu] })

    function renderMsg (msg) {
      var el = api.message.html.render(msg)
      var queryTerms = query.split(whitespace)

      highlight(el, createOrRegExp(queryTerms))
      return el
    }

    function draw () {
      resetFeed({ container, content })

      // TODO figure out how to step on kinda orderless search results
      pull(
        // api.sbot.pull.stream(sbot => next(sbot.search.query, { query, limit: 500 })),
        api.sbot.pull.stream(sbot => sbot.search.query({ query, limit: 500 })),
        filterDownThrough(),
        pull.through(() => search.matches.set(search.matches() + 1)),
        Scroller(container, content, renderMsg, false, false)
      )
    }

    draw()

    container.title = '?' + query
    return container
  }
}

function createOrRegExp (ary) {
  return new RegExp(ary.map(function (e) {
    return '\\b' + e + '\\b'
  }).join('|'), 'i')
}

function highlight (el, query) {
  var searcher = new TextNodeSearcher({container: el})
  searcher.query = query
  searcher.highlight()
  return el
}

