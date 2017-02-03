const fs = require('fs')
const h = require('hyperscript')
const u = require('../util')
const pull = require('pull-stream')
const Scroller = require('pull-scroll')
const { ScrollNotify } = u

exports.needs = {
  build_scroller: 'first',
  message_render: 'first',
  message_compose: 'first',
  sbot_log: 'first',
}

exports.gives = {
  builtin_tabs: true,
  screen_view: true,
  // mcss: true
}

exports.create = function (api) {
  return {
    builtin_tabs,
    screen_view,
    // mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
  }

  function builtin_tabs () {
    return ['/public']
  }

  function screen_view (path, sbot) {
    if(path !== '/public') return 

    const composer = api.message_compose({type: 'post'}, {placeholder: 'Write a public message'})
    var { container, content } = api.build_scroller({ prepend: composer })

    pull(
      u.next(api.sbot_log, {old: false, limit: 100}),
      ScrollNotify(container, Scroller(container, content, api.message_render, true, false))
    )

    pull(
      u.next(api.sbot_log, {reverse: true, limit: 100, live: false}),
      Scroller(container, content, api.message_render, false, false)
    )

    return container
  }
}

