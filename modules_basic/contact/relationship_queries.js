var pull = require('pull-stream')

//this is a bit crude, and doesn't actually show unfollows yet.

function makeQuery (a, b) {
  return {"$filter": {
    value: {
      author: a,
      content: {
        type: 'contact',
        contact: b,
        following: true
      }
    },
  }}
}


exports.needs = { 
  sbot: { query: 'first' }
}

exports.gives = {
  contact: {
    follows: true,
    followers: true,
    follower_of: true
  }
}

exports.create = function (api) {

  return {
    contact: {
      follows,
      followers,
      follower_of
    }
  }

  function follows (id, cb) {
    return api.sbot.query({query: [
      makeQuery(id, {$prefix:"@"}),
      {"$map": ['value', 'content', 'contact']}
    ]})
  }

  function followers (id) {
    return api.sbot.query({query: [
      makeQuery({$prefix:"@"}, id),
      {"$map": ['value', 'author']}
    ]})
  }

  function follower_of (source, dest, cb) {
    pull(
      api.sbot.query({query: [
        makeQuery(source, dest),
        {$map: ['value', 'content', 'following']}
      ]}),
      pull.collect(function (err, ary) {
        if(err) return cb(err)
        else cb(null, ary.pop()) //will be true, or undefined/false
      })
    )
  }
}


