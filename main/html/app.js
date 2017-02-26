const { h } = require('mutant')
const nest = require('depnest')
const insertCss = require('insert-css')
const Tabs = require('hypertabs')

exports.gives = nest('main.html.app')

exports.needs = nest({
  'router.html.page': 'first',
  'styles.css': 'reduce'
})

exports.create = function (api) {
  return nest('main.html.app', app)

  function app () {
    const css = values(api.styles.css()).join('\n')
    insertCss(css)

    var tabs = Tabs() // optional onSelect cb
    var App = h('App', tabs)
    ;['/public', '/private', '/notifications'].forEach(addPage(tabs))
    tabs.select(0)

    catchClick(App, (link, { ctrlKey: openBackground, isExternal }) => {
      if (tabs.has(link)) tabs.select(link)
      else {
        const changeTab = !openBackground
        addPage(tabs, changeTab)(link)
      }

      // TODO add external-links module
    })

    return App
  }

  function addPage (tabs, change, split) {
    return function (link) {
      const page = api.router.html.page(link)
      if (!page) return

      page.id = page.id || link
      tabs.add(page, change, split)
    }
  }
}

function values (object) {
  const keys = Object.keys(object)
  return keys.map(k => object[k])
}

// TODO - replace with extracted module
var Url = require('url')

function catchClick (root, cb) {
  root.addEventListener('click', (ev) => {
    if (ev.target.tagName === 'INPUT' && ev.target.type === 'file') return
    if (ev.defaultPrevented) return // TODO check this is in the right place
    ev.preventDefault()
    ev.stopPropagation()

    var anchor = null
    for (var n = ev.target; n.parentNode; n = n.parentNode) {
      if (n.nodeName === 'A') {
        anchor = n
        break
      }
    }
    if (!anchor) return true

    var href = anchor.getAttribute('href')
    if (!href) return

    var url = Url.parse(href)
    var opts = {
      altKey: ev.altKey,
      ctrlKey: ev.ctrlKey,
      metaKey: ev.metaKey,
      shiftKey: ev.shiftKey,
      isExternal: !!url.host
    }

    cb(href, opts)
  })
}

