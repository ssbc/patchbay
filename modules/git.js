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
var avatar_name = plugs.first(exports.avatar_name = [])
var markdown = plugs.first(exports.markdown = [])

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

function messageTimestampLink(msg) {
  var m = moment(msg.value.timestamp)
  return h('a.timestamp', {
    timestamp: m,
    title: m.format('LLLL'),
    href: '#'+msg.key
  }, m.fromNow())
}

function tableRows(headerRow) {
  var thead = h('thead'), tbody = h('tbody')
  var first = true
  var t = [thead, tbody]
  t.append = function (row) {
    if (first) {
      first = false
      thead.appendChild(headerRow)
    }
    tbody.appendChild(row)
  }
  return t
}

function repoName(id, link) {
  var el = link
    ? h('a', {href: '#'+id}, id.substr(0, 8) + '…')
    : h('ins', id.substr(0, 8) + '…')
  getAvatar({links: sbot_links}, self_id, id, function (err, avatar) {
    if(err) return console.error(err)
    el.textContent = avatar.name
  })
  return el
}

exports.message_content = function (msg, sbot) {
  var c = msg.value.content

  if(c.type === 'git-repo') {
    var nameEl
    var branchesT, tagsT, openIssuesT, closedIssuesT, openPRsT, closedPRsT
    var div = h('div',
      h('p', 'git repo ', repoName(msg.key)),
      c.upstream ? h('p', 'fork of ', repoName(c.upstream, true)) : '',
      h('p', h('code', 'ssb://' + msg.key)),
      h('div.git-table-wrapper', {style: {'max-height': '12em'}},
        h('table',
          branchesT = tableRows(h('tr',
            h('th', 'branch'),
            h('th', 'commit'),
            h('th', 'last update'))),
          tagsT = tableRows(h('tr',
            h('th', 'tag'),
            h('th', 'commit'),
            h('th', 'last update'))))),
      h('div.git-table-wrapper', {style: {'max-height': '16em'}},
        h('table',
          openIssuesT = tableRows(h('tr',
            h('th', 'open issues'))),
          closedIssuesT = tableRows(h('tr',
            h('th', 'closed issues'))))),
      h('div.git-table-wrapper', {style: {'max-height': '16em'}},
        h('table',
          openPRsT = tableRows(h('tr',
            h('th', 'open pull requests'))),
          closedPRsT = tableRows(h('tr',
            h('th', 'closed pull requests'))))))

    // compute refs
    var refs = {}
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
        for (var ref in refUpdates) {
          if (refs[ref]) continue
          refs[ref] = true
          var rev = refUpdates[ref]
          if (!rev) continue
          var parts = /^refs\/(heads|tags)\/(.*)$/.exec(ref) || []
          var t
          if (parts[1] === 'heads') t = branchesT
          else if (parts[1] === 'tags') t = tagsT
          if (t) t.append(h('tr',
            h('td', parts[2]),
            h('td', h('code', rev)),
            h('td', messageTimestampLink(link))))
        }
      }, function (err) {
        if (err) console.error(err)
      })
    )

    // list issues and pull requests
    pull(
      sbot_links({
        reverse: true,
        dest: msg.key,
        rel: 'project',
        values: true
      }),
      paramap(function (link, cb) {
        getIssueState(link.key, function (err, state) {
          if(err) return cb(err)
          link.state = state
          cb(null, link)
        })
      }),
      pull.drain(function (link) {
        var c = link.value.content
        // TODO: support renamed issues
        var title = c.title || (c.text ? c.text.length > 30
          ? c.text.substr(0, 30) + '…'
          : c.text : link.key)
        var author = link.value.author
        var t = c.type === 'pull-request'
          ? link.state === 'open' ? openPRsT : closedPRsT
          : link.state === 'open' ? openIssuesT : closedIssuesT
        t.append(h('tr',
          h('td',
            h('a', {href: '#'+link.key}, title), h('br'),
            h('small',
              'opened ', messageTimestampLink(link),
              ' by ', h('a', {href: '#'+author}, avatar_name(author))))))
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

  if (c.type === 'issue') {
    return h('div',
      h('p', 'opened issue on ', repoLink(c.project)),
      c.title ? h('h4', c.title) : '',
      markdown(c)
    )
  }

  if (c.type === 'pull-request') {
    return h('div',
      h('p', 'opened pull-request ',
        'to ', repoLink(c.repo), ':', c.branch, ' ',
        'from ', repoLink(c.head_repo), ':', c.head_branch),
      c.title ? h('h4', c.title) : '',
      markdown(c)
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
