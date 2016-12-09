var pull = require('pull-stream')
//var plugs = require('../plugs')

//var sbot_query = plugs.first(exports.sbot_query = [])

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


exports.needs = { sbot_query: 'first' }

exports.gives = {
  follows: true,
  followers: true,
  follower_of: true
}

exports.create = function (api) {

  return {
    follows: function (id, cb) {
      return api.sbot_query({query: [
        makeQuery(id, {$prefix:"@"}),
        {"$map": ['value', 'content', 'contact']}
      ]})
    },

    followers: function (id) {
      return api.sbot_query({query: [
        makeQuery({$prefix:"@"}, id),
        {"$map": ['value', 'author']}
      ]})
    },

    follower_of: function (source, dest, cb) {
      pull(
        api.sbot_query({query: [
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

}

