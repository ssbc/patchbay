const fs = require('fs')
const u = require('../../util')
const pull = require('pull-stream')
const Scroller = require('pull-scroll')

exports.needs = {
  message: {
    render: 'first',
    compose: 'first'
  },
  sbot: { log: 'first' },
  helpers: {
    build_scroller: 'first'
  }
}

exports.gives = {
  builtin_tabs: true,
  page: true,
  // mcss: true
}

exports.create = function (api) {
  return {
    builtin_tabs,
    page,
    // mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
  }

  function builtin_tabs () {
    return ['/public']
  }

  function page (path, sbot) {
    if(path !== '/public') return 

    const composer = api.message.compose({type: 'post'}, {placeholder: 'Write a public message'})
    var { container, content } = api.helpers.build_scroller({ prepend: composer })

    pull(
      u.next(api.sbot.log, {old: false, limit: 100}),
      Scroller(container, content, api.message.render, true, false)
    )

    pull(
      u.next(api.sbot.log, {reverse: true, limit: 100, live: false}),
      Scroller(container, content, api.message.render, false, false)
    )

    return container
  }
}

