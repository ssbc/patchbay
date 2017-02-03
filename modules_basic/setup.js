var h = require('hyperscript')
var pull = require('pull-stream')

exports.needs = {
  avatar: 'first',
  avatar_edit: 'first',
  invite_parse: 'first',
  invite_accept: 'first',
  sbot_progress: 'first',
  sbot_query: 'first'
}

exports.gives = {
  setup_is_fresh_install: true,
  progress_bar: true,
  setup_joined_network: true,
  screen_view: true
}

//maybe this could show the pubs, or
//if someone locally follows you,
//it could show the second degree pubs?

//maybe show the network as animated graph?

function followers_query (id) {
  return [{$filter: {
     value: {content: {
       type: "contact",
       contact: id,
       following: true,
//       autofollow: true
     }}
  }}]
}

exports.create = function (api) {
  return {
    setup_is_fresh_install,
    progress_bar,
    setup_joined_network,
    screen_view
  }

  //test whether we are connected to the ssb network.
  function setup_is_fresh_install (cb) {
    //test by checking whether you have any friends following you?
    pull(
      api.sbot_query({query: followers_query(id), limit: 1, live: false}),
      pull.collect(function (err, ary) {
        cb(err, !!ary.length)
      })
    )
  }

  function invite_form () {
    var accept = h('button', 'enter code', {disabled: true, onclick: function () {
      api.invite_accept(input.value, function (msg) {
        status.textContent = msg
      }, function (err) {
        if(err) {
          accept.textContent = 'error:'+(err.message || err.stack || error.type)
          console.error(err)
        }
        else {
          input.value = ''
          accept.textContent = 'success!'
        }
      })
    }})

    function parseInput () {
      if(!input.value) {
        accept.disabled = true
        accept.textContent = 'enter code'
      }
      else if(!invite_parse(input.value)) {
        accept.disabled = true
        accept.textContent = 'invalid code'
      }
      else {
        accept.disabled = false
        accept.textContent = 'accept'
      }
    }

    var input = h('input.wide', {placeholder: 'invite code', oninput: parseInput, onchange: parseInput})

    return h('div.invite-form.row', input, accept)
  }

  function progress_bar () {
    var liquid = h('div.hyperprogress__liquid', '.')
    var bar = h('div.hyperprogress__bar', liquid)
    liquid.style.width = '0%'

    pull(
      api.sbot_progress(),
      pull.drain(function (e) {
        liquid.style.width = Math.round((e.progress/e.total)*100)+'%'
      })
    )

    return bar
  }

  //show the first 5 followers, and how they join you to the network.
  //so this will show if a local peer follows you.

  //when you join the network, I want this to show as people follow you.
  //that could be when a pub accepts the invite, or when a local peer accepts.

  function setup_joined_network (id) {
    var followers = h('div.column')
    var label = h('label', 'not connected to a network')
    var joined = h('div.setup__joined', label, followers)

    pull(
      api.sbot_query({query: followers_query(id), limit: 5, live: true, sync: false}),
      pull.drain(function (follower) {
        if(follower.sync) return
        label.textContent = 'connected to network via...'
        followers.appendChild(
          api.avatar(follower.value.author, 'thumbnail')
        )
      })
    )

    return joined
  }

  function screen_view (path) {
    if(path !== '/setup') return

    var { id } = require('../keys')

    //set up an avatar

    var status = h('span')
    var invite = h('input', {placeholder: 'invite code'})
    return h('div.scroller', [
      h('div.scroller__wrapper', [
        h('h1', 'welcome to patchbay!'),
        h('div',
          'please choose avatar image and name',
          api.avatar_edit(id)
        ),
        h('h2', 'join network'),
        invite_form(),
        //show avatars of anyone on the same local network.
        //show realtime changes in your followers, especially for local.

        progress_bar(),
        setup_joined_network(id)
      ])
    ])
  }
}

