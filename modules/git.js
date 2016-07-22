var h = require('hyperscript')
var pull = require('pull-stream')
var paramap = require('pull-paramap')
var moment = require('moment')

var plugs = require('../plugs')
var message_link = plugs.first(exports.message_link = [])
var sbot_links = plugs.first(exports.sbot_links = [])
var sbot_links2 = plugs.first(exports.sbot_links2 = [])
var sbot_get = plugs.first(exports.sbot_get = [])
var getAvatar = require('ssb-avatar')

var self_id = require('../keys').id

function shortRefName(ref) {
  return ref.replace(/^refs\/(heads|tags)\//, '')
}

function repoLink(id) {
  var el = h('a', {href: '#'+id}, id.substr(0, 10) + '…')
  getAvatar({links: sbot_links}, self_id, id, function (err, avatar) {
    if(err) return console.error(err)
    el.textContent = avatar.name
  })
  return el
}

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
    var nameEl, refsTable
    var div = h('div',
      h('p', 'git repo ', nameEl = h('ins')),
      h('p', h('code', 'ssb://' + msg.key)),
      refsTable = h('table')
    )

    // show repo name
    getAvatar({links: sbot_links}, self_id, msg.key, function (err, avatar) {
      if(err) return console.error(err)
      nameEl.textContent = avatar.name
    })

    // compute refs
    var refs = {}
    var first = true
    pull(
      sbot_links({
        reverse: true,
        source: msg.value.author,
        dest: msg.key,
        rel: 'repo',
        values: true
      }),
      pull.drain(function (link) {
        var refUpdates = link.value.content.refs
        if (first) {
          first = false
          refsTable.appendChild(h('tr',
            h('th', 'branch'),
            h('th', 'commit'),
            h('th', 'last update')))
        }
        for (var ref in refUpdates) {
          if (refs[ref]) continue
          refs[ref] = true
          var rev = refUpdates[ref]
          var m = moment(link.value.timestamp)
          refsTable.appendChild(h('tr',
            h('td', shortRefName(ref)),
            h('td', h('code', rev)),
            h('td', h('a.timestamp', {
              timestamp: m,
              title: m.format('LLLL'),
              href: '#'+link.key
            }, m.fromNow()))))
        }
      }, function (err) {
        if (err) console.error(err)
      })
    )

    return div
  }

  if(c.type === 'git-update') {
    return h('p',
      'pushed to ',
      repoLink(c.repo),
      c.refs ? h('ul', Object.keys(c.refs).map(function (ref) {
        var rev = c.refs[ref]
        return h('li',
          shortRefName(ref) + ': ',
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
