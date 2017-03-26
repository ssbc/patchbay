const nest = require('depnest')
const Url = require('url')

exports.gives = nest('main.async.catchLinkClick')

exports.create = function (api) {
  return nest('main.async.catchLinkClick', catchLinkClick)

  function catchLinkClick (root, cb) {
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

}

