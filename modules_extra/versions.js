var h = require('hyperscript')

exports.menu_items = function () {
  return h('a', {href: '#/versions'}, '/versions')
}

exports.builtin_tabs = function () {
  return ['/versions']
}

exports.screen_view = function (path) {
  if(path !== '/versions') return

  if('undefined' === typeof WebBoot)
    return h('h1', 'must run with web-boot enabled enviroment')

  var content = h('div.column')

  WebBoot.versions(function (err, log) {
    log.forEach(function (e, i) {
      content.appendChild(
        h('div.row',
          h('a', {
            href: '#/run:'+e.value,
            onclick: function () {
              WebBoot.run(e.value, function () {
                console.log('rebooting to:', e.value)
              })
            }
          }, ' ', e.value, ' ', new Date(e.ts)),
          !i && h('label', '(current)')
        )
      )
    })

  })

  return content
}

