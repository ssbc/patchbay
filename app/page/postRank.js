const nest = require('depnest')
const { h, Value, computed, when } = require('mutant')
const Scroller = require('pull-scroll')
const next = require('pull-next-query')
const pull = require('pull-stream')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.postRank': true
})

exports.needs = nest({
  'app.html.scroller': 'first',
  'app.sync.goTo': 'first',
  'keys.sync.id': 'first',
  'channel.obs.subscribed': 'first',
  'contact.obs.following': 'first',
  'sbot.pull.log': 'first',
  'message.html.render': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.menuItem': menuItem,
    'app.page.postRank': page
  })

  function menuItem () {
    return h('a', {
      style: { order: 1 },
      'ev-click': () => api.app.sync.goTo({ page: 'postRank' })
    }, '/postRank')
  }

  function getPosts(channelPostBoost, friendPostBoost, friendVoteBoost, friendCommentBoost, threshold, cb)
  {
    let weights = {
      post: 1, // base
      channelPost: channelPostBoost,
      friendPost: friendPostBoost,

      vote: 0.5, // base
      friendVote: friendVoteBoost,

      comment: 1, // base
      friendComment: friendCommentBoost
    }

    console.log("weights", weights)

    const myKey = api.keys.sync.id()
    let myChannels = api.channel.obs.subscribed(myKey)()
    let imFollowing = new Set(api.contact.obs.following(myKey)())

    console.log(myChannels)
    console.log(imFollowing)

    var messages = {}
    
    console.log("pulling", new Date())

    return pull(
      api.sbot.pull.log({ reverse: true, limit: 10000 }),
      pull.drain((msg) => {
        let content = msg.value.content
        if (content.type == 'post' && content.root == undefined)
        {
          let score = weights['post']
          if (imFollowing.has(msg.value.author))
            score += weights['friendPost']
          if (myChannels.has(content.channel))
            score += weights['channelPost']

          msg.score = score
          messages[msg.key] = msg
        }
        else if (content.type == 'post' && content.root != msg.key)
        {
          let score = weights['comment']
          if (imFollowing.has(msg.value.author))
            score += weights['friendComment']

          if (content.root in messages)
            messages[content.root].score += score
        }
        else if (content.type == 'vote')
        {
          let score = weights['vote']
          if (imFollowing.has(msg.value.author))
            score += weights['friendVote']

          if (content.vote && content.vote.link in messages)
            messages[content.vote.link].score += score
        }
      }, function(err) {
        console.log("Went through " + Object.keys(messages).length, new Date())

        let msgs = Object.values(messages)
        msgs.sort((lhs, rhs) => {
          return rhs.score - lhs.score
        })

        cb(msgs.filter(msg => msg.score > threshold))
      })
    )
  }
  
  function page (location) {

    let channelPostBoost = +2
    let friendPostBoost = +3
    let friendVoteBoost = +1
    let friendCommentBoost = +2
    let threshold = 10

    let top = [
      h('span.label', 'Channel boost:'),
      h('input',
        {
          'type': 'number',
          value: channelPostBoost,
          'ev-input': ev => channelPostBoost = parseFloat(ev.target.value)
        }),

      h('span.label', 'Friend post boost:'),
      h('input',
        {
          'type': 'number',
          value: friendPostBoost,
          'ev-input': ev => friendPostBoost = parseFloat(ev.target.value)
        }),

      h('span.label', 'Friend vote boost:'),
      h('input',
        {
          'type': 'number',
          value: friendVoteBoost,
          'ev-input': ev => friendVoteBoost = parseFloat(ev.target.value)
        }),

      h('span.label', 'Friend comment boost:'),
      h('input',
        {
          'type': 'number',
          value: friendCommentBoost,
          'ev-input': ev => friendCommentBoost = parseFloat(ev.target.value)
        }),

      h('span.label', 'Threshold:'),
      h('input',
        {
          'type': 'number',
          value: threshold,
          'ev-input': ev => threshold = parseFloat(ev.target.value)
        }),

      h('button', {
        'ev-click': draw
      }, 'Go!')
    ]
    
    const { container, content } = api.app.html.scroller({ prepend: top })

    function draw () {
      // reset
      container.scroll(0)
      content.innerHTML = ''

      getPosts(channelPostBoost, friendPostBoost, friendVoteBoost, friendCommentBoost, threshold,
        (msgs) => {
          console.log("msgs", msgs)

          pull(
            pull.values(msgs),
            Scroller(container, content, api.message.html.render)
          )
        }
      )
    }

    container.title = '/postRank'
    return container
  }
}
