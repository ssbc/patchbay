const { h } = require('mutant')
const nest = require('depnest')
const insertCss = require('insert-css')
const Tabs = require('hypertabs')

exports.gives = nest('main.html.app')

exports.needs = nest({
  'main.html': {
    error: 'first',
    externalConfirm: 'first',
    search: 'first'
  },
  'router.html.page': 'first',
  'styles.css': 'reduce'
})

exports.create = function (api) {
  return nest('main.html.app', app)

  function app () {
    const css = values(api.styles.css()).join('\n')
    insertCss(css)

    function onSelect (indexes) {
      const ids = indexes.map(index => tabs.get(index).content.id)
      if (!search) { console.log('THERE SHOULD BE A SEARCH, GOT', search) ; return }

      if (ids.length > 1) search.input.value = 'split('+ids.join(',')+')'
      else search.input.value = ids[0]
    }
    const search = api.main.html.search((path, change) => {
      if (tabs.has(path)) {
        tabs.select(path)
        return true
      }

      var page = addPage(path, true, false)
      return change
    })
    const tabs = Tabs(onSelect, { append: h('div.navExtra', [ search ]) })
    const App = h('App', tabs)

    function addPage (link, change, split) {
      const page = api.router.html.page(link)
      if (!page) return

      page.id = page.id || link
      tabs.add(page, change, split)
    }
    const initialTabs = ['/public', '/private', '/notifications']
    initialTabs.forEach(p => addPage(p))
    tabs.select(0)

    catchClick(App, (link, { ctrlKey: openBackground, isExternal }) => {
      if (isExternal) api.main.html.externalConfirm(link)

      if (tabs.has(link)) tabs.select(link)
      else {
        const changeTab = !openBackground
        addPage(link, changeTab)
      }
    })

    // Catch errors
    var { container: errorPage, content: errorList } = api.router.html.page('/errors')
    window.addEventListener('error', ev => {
      if (!tabs.has('/errors')) tabs.add(errorPage, true)

      const error = api.main.html.error(ev.error || ev)
      errorList.appendChild(error)
    })

    return App
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

