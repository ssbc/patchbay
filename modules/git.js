var h = require('hyperscript')
var pull = require('pull-stream')
var paramap = require('pull-paramap')
var human = require('human-time')

var plugs = require('../plugs')
var message_link = plugs.first(exports.message_link = [])
var message_confirm = plugs.first(exports.message_confirm = [])
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
    sbot_links({dest: id, rel: 'issues', values: true, reverse: true}),
    pull.map(function (msg) {
      return msg.value.content.issues
    }),
    pull.flatten(),
    pull.filter(function (issue) {
      return issue.link === id
    }),
    pull.map(function (issue) {
      return issue.merged ? 'merged' : issue.open ? 'open' : 'closed'
    }),
    pull.take(1),
    pull.collect(function (err, updates) {
      cb(err, updates && updates[0] || 'open')
    })
  )
}

//todo: 
function messageTimestampLink(msg) {
  return h('a.timestamp', {
    timestamp: msg.value.timestamp,
    title: new Date(msg.value.timestamp),
    href: '#'+msg.key
  }, human(msg.value.timestamp))
}

// a thead+tbody where the thead only is added when the first row is added
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

function renderIssueEdit(c) {
  var id = c.issue || c.link
  return [
    c.title ? h('p', 'renamed issue ', message_link(id),
      ' to ', h('ins', c.title)) : null,
    c.open === false ? h('p', 'closed issue ', message_link(id)) : null,
    c.open === true ? h('p', 'reopened issue ', message_link(id)) : null]
}

exports.message_content = function (msg, sbot) {
  var c = msg.value.content

  if(c.type === 'git-repo') {
    var branchesT, tagsT, openIssuesT, closedIssuesT, openPRsT, closedPRsT
    var forksT
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
            h('th', 'closed pull requests'))))),
      h('div.git-table-wrapper',
        h('table',
          forksT = tableRows(h('tr',
            h('th', 'forks'))))))

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
        var refUpdates = link.value.content.refs || {}
        Object.keys(refUpdates).reverse().filter(function (ref) {
          if (refs[ref]) return
          refs[ref] = true
          var rev = refUpdates[ref]
          if (!rev) return
          var parts = /^refs\/(heads|tags)\/(.*)$/.exec(ref) || []
          var t
          if (parts[1] === 'heads') t = branchesT
          else if (parts[1] === 'tags') t = tagsT
          if (t) t.append(h('tr',
            h('td', parts[2]),
            h('td', h('code', rev)),
            h('td', messageTimestampLink(link))))
        })
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
        var title = c.title || (c.text ? c.text.length > 70
          ? c.text.substr(0, 70) + '…'
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

    // list forks
    pull(
      sbot_links({
        reverse: true,
        dest: msg.key,
        rel: 'upstream'
      }),
      pull.drain(function (link) {
        forksT.append(h('tr', h('td',
          repoName(link.key, true),
          ' by ', h('a', {href: '#'+link.source}, avatar_name(link.source)))))
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

  if(c.type === 'issue-edit') {
    return h('div',
      c.issue ? renderIssueEdit(c) : null,
      c.issues ? c.issues.map(renderIssueEdit) : null)
  }

  if(c.type === 'issue') {
    return h('div',
      h('p', 'opened issue on ', repoLink(c.project)),
      c.title ? h('h4', c.title) : '',
      markdown(c)
    )
  }

  if(c.type === 'pull-request') {
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
  if (type === 'issue' || type === 'pull-request') {
    var el = h('em', '...')
    // TODO: update if issue is changed
    getIssueState(msg.key, function (err, state) {
      if (err) return console.error(err)
      el.textContent = state
    })
    return el
  }
}

exports.message_action = function (msg, sbot) {
  var c = msg.value.content
  if(c.type === 'issue' || c.type === 'pull-request') {
    var isOpen
    var a = h('a', {href: '#', onclick: function () {
      message_confirm({
        type: 'issue-edit',
        root: msg.key,
        issues: [{
          link: msg.key,
          open: !isOpen
        }]
      }, function (err, msg) {
        if(err) return alert(err)
        if(!msg) return
        isOpen = msg.value.content.open
        update()
      })
    }})
    getIssueState(msg.key, function (err, state) {
      if (err) return console.error(err)
      isOpen = state === 'open'
      update()
    })
    function update() {
      a.textContent = c.type === 'pull-request'
        ? isOpen ? 'Close Pull Request' : 'Reopen Pull Request'
        : isOpen ? 'Close Issue' : 'Reopen Issue'
    }
    return a
  }
}

