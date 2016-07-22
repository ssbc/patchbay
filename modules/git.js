var h = require('hyperscript')
var pull = require('pull-stream')

var plugs = require('../plugs')
var message_link = plugs.first(exports.message_link = [])
var sbot_links = plugs.first(exports.sbot_links = [])

function getIssueState(id, cb) {
  pull(
    sbot_links({dest: id, rel: 'issues', values: true}),
    pull.map(function (msg) {
      var issues = msg.value.content.issues
      if (!Array.isArray(issues)) return
      return issues.filter(function (issue) {
        return issue.link === id
      }).map(function (issue) {
        return {
          ts: msg.value.timestamp,
          open: issue.open,
          merged: issue.merged,
        }
      })
    }),
    pull.flatten(),
    pull.collect(function (err, updates) {
      if (err) return cb(err)
      var open = true, merged = false
      updates.sort(function (a, b) {
        return b.ts - a.ts
      }).forEach(function (update) {
        if (update.open != null)
          open = update.open
        if (update.merged != null)
          merged = update.merged
      })
      cb(null, open ? 'open' : merged ? 'merged' : 'closed')
    })
  )
}

exports.message_content = function (msg, sbot) {
  var c = msg.value.content

  if(c.type === 'git-repo') {
    return h('p', 'git repo')
  }

  if(c.type === 'git-update') {
    return h('p',
      'git-pushed to ',
      message_link(c.repo),
      c.refs ? h('ul', Object.keys(c.refs).map(function (ref) {
        var rev = c.refs[ref]
        var shortName = ref.replace(/^refs\/(heads|tags)\//, '')
        return h('li',
          shortName + ': ',
          rev ? h('code', rev) : h('em', 'deleted'))
      })) : null,
      Array.isArray(c.issues) ? c.issues.map(function (issue) {
        if (issue.merged === true)
          return ['Merged ', message_link(issue.link), ' in ',
            h('code', issue.object), ' ', h('q', issue.label)]
        if (issue.open === false)
          return ['Closed ', message_link(issue.link), ' in ',
            h('code', issue.object), ' ', h('q', issue.label)]
      }) : null
    )
  }
}

exports.message_meta = function (msg, sbot) {
  var type = msg.value.content.type
  if (type == 'issue' || type == 'pull-request') {
    var el = h('em', '...')
    getIssueState(msg.key, function (err, state) {
      if (err) return console.error(err)
      el.textContent = state
    })
    return el
  }
}
