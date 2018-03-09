const nest = require('depnest')
const Url = require('url')

exports.gives = nest('app.async.catchLinkClick')

exports.needs = nest({
  'app.html.externalConfirm': 'first',
  'history.sync.push': 'first',
  'router.async.normalise': 'first'
})

exports.create = function (api) {
  return nest('app.async.catchLinkClick', catchLinkClick)

  function catchLinkClick (root, cb = defaultCallback) {
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
      if (!href || href === '#') return

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

  function defaultCallback (link, { ctrlKey, isExternal }) {
    if (isExternal) return api.app.html.externalConfirm(link)

    const openBackground = ctrlKey
    api.router.async.normalise(link, (err, location) => {
      if (err) throw err

      if (openBackground) location.temp = { openBackground }
      api.history.sync.push(location)
    })
  }
}
