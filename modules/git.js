var h = require('hyperscript')
var pull = require('pull-stream')
var paramap = require('pull-paramap')
var cat = require('pull-cat')
var human = require('human-time')
var combobox = require('hypercombo')

var plugs = require('../plugs')
var message_link = plugs.first(exports.message_link = [])
var message_confirm = plugs.first(exports.message_confirm = [])
var message_compose = plugs.first(exports.message_compose = [])
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

function getRefs(msg) {
  var refs = {}
  var commitTitles = {}
  return pull(
    sbot_links({
      reverse: true,
      source: msg.value.author,
      dest: msg.key,
      rel: 'repo',
      values: true
    }),
    pull.map(function (link) {
      var refUpdates = link.value.content.refs || {}
      var commits = link.value.content.commits
      if(commits) {
        for(var i = 0; i < commits.length; i++) {
          var commit = commits[i]
          if(commit && commit.sha1 && commit.title) {
            commitTitles[commit.sha1] = commit.title
          }
        }
      }
      return Object.keys(refUpdates).reverse().map(function (ref) {
        if(refs[ref]) return
        refs[ref] = true
        var rev = refUpdates[ref]
        if(!rev) return
        return {
          name: ref,
          rev: rev,
          link: link,
          title: commitTitles[rev],
        }
      }).filter(Boolean)
    }),
    pull.flatten()
  )
}

function getForks(id) {
  return pull(
    sbot_links({
      reverse: true,
      dest: id,
      rel: 'upstream'
    }),
    pull.map(function (link) {
      return {
        id: link.key,
        author: link.source
      }
    })
  )
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
  var date = new Date(msg.value.timestamp)
  return h('a.timestamp', {
    timestamp: msg.value.timestamp,
    title: date,
    href: '#'+msg.key
  }, human(date))
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
            h('th', 'forks'))))),
      h('div', h('a', {href: '#', onclick: function () {
        this.parentNode.replaceChild(issueForm(msg), this)
      }}, 'New Issue…')),
      h('div', h('a', {href: '#', onclick: function () {
        this.parentNode.replaceChild(pullRequestForm(msg), this)
      }}, 'New Pull Request…')))

    pull(getRefs(msg), pull.drain(function (ref) {
      var parts = /^refs\/(heads|tags)\/(.*)$/.exec(ref.name) || []
      var t
      if(parts[1] === 'heads') t = branchesT
      else if(parts[1] === 'tags') t = tagsT
      if(t) t.append(h('tr',
        h('td', parts[2]),
        h('td', h('code', ref.rev)),
        h('td', messageTimestampLink(ref.link))))
    }, function (err) {
      if(err) console.error(err)
    }))

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
      getForks(msg.key),
      pull.drain(function (fork) {
        forksT.append(h('tr', h('td',
          repoName(fork.id, true),
          ' by ', h('a', {href: '#'+fork.author}, avatar_name(fork.author)))))
      }, function (err) {
        if (err) console.error(err)
      })
    )

    return div
  }

  if(c.type === 'git-update') {
    return [
      h('p', 'pushed to ', repoLink(c.repo)),
      c.refs ? h('ul', Object.keys(c.refs).map(function (ref) {
        var rev = c.refs[ref]
        return h('li',
          shortRefName(ref) + ': ',
          rev ? h('code', rev) : h('em', 'deleted'))
      })) : null,
      Array.isArray(c.commits) ? [
        h('ul',
          c.commits.map(function (commit) {
            return h('li',
              typeof commit.sha1 === 'string' ?
                [h('code', commit.sha1.substr(0, 8)), ' '] : null,
              commit.title ?
                h('q', commit.title) : null)
          }),
          c.commits_more > 0 ?
            h('li', '+ ', c.commits_more, ' more') : null)
      ] : null,
      Array.isArray(c.issues) ? c.issues.map(function (issue) {
        if (issue.merged === true)
          return h('p', 'Merged ', message_link(issue.link), ' in ',
            h('code', issue.object), ' ', h('q', issue.label))
        if (issue.open === false)
          return h('p', 'Closed ', message_link(issue.link), ' in ',
            h('code', issue.object), ' ', h('q', issue.label))
      }) : null
    ]
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

function findMessageContent(el) {
  for(; el; el = el.parentNode) {
    if(el.classList.contains('message')) {
      return el.querySelector('.message_content')
    }
  }
}

function issueForm(msg, contentEl) {
  return h('form',
    h('strong', 'New Issue:'),
    message_compose(
      {type: 'issue', project: msg.key},
      function (value) { return value },
      function (err, issue) {
        if(err) return alert(err)
        if(!issue) return
        var title = issue.value.content.text
        if(title.length > 70) title = title.substr(0, 70) + '…'
        form.appendChild(h('div',
          h('a', {href: '#'+issue.key}, title)
        ))
      }
    )
  )
}

function branchMenu(msg, full) {
  return combobox({
    style: {'max-width': '14ex'},
    placeholder: 'branch…',
    default: 'master',
    read: msg && pull(getRefs(msg), pull.map(function (ref) {
      var m = /^refs\/heads\/(.*)$/.exec(ref.name)
      if(!m) return
      var branch = m[1]
      var label = branch
      if(full) {
        var updated = new Date(ref.link.value.timestamp)
        label = branch +
          ' · ' + human(updated) +
          ' · ' + ref.rev.substr(1, 8) +
          (ref.title ? ' · "' + ref.title + '"' : '')
      }
      return h('option', {value: branch}, label)
    }))
  })
}

function pullRequestForm(msg) {
  var headRepoInput
  var headBranchInput = branchMenu()
  var branchInput = branchMenu(msg)
  var form = h('form',
    h('strong', 'New Pull Request:'),
    h('div',
      'from ',
      headRepoInput = combobox({
        style: {'max-width': '26ex'},
        onchange: function () {
          // list branches for selected repo
          var repoId = this.value
          if(repoId) sbot_get(repoId, function (err, value) {
            if(err) console.error(err)
            var msg = value && {key: repoId, value: value}
            headBranchInput = headBranchInput.swap(branchMenu(msg, true))
          })
          else headBranchInput = headBranchInput.swap(branchMenu())
        },
        read: pull(cat([
          pull.once({id: msg.key, author: msg.value.author}),
          getForks(msg.key)
        ]), pull.map(function (fork) {
          return h('option', {value: fork.id},
            repoName(fork.id), ' by ', avatar_name(fork.author))
        }))
      }),
      ':',
      headBranchInput,
      ' to ',
      repoName(msg.key),
      ':',
      branchInput),
    message_compose(
      {
        type: 'pull-request',
        project: msg.key,
        repo: msg.key,
      },
      function (value) {
        value.branch = branchInput.value
        value.head_repo = headRepoInput.value
        value.head_branch = headBranchInput.value
        return value
      },
      function (err, issue) {
        if(err) return alert(err)
        if(!issue) return
        var title = issue.value.content.text
        if(title.length > 70) title = title.substr(0, 70) + '…'
        form.appendChild(h('div',
          h('a', {href: '#'+issue.key}, title)
        ))
      }
    )
  )
  return form
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

