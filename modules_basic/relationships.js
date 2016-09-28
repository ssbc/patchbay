var pull = require('pull-stream')
var plugs = require('../plugs')

var sbot_query = plugs.first(exports.sbot_query = [])

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


exports.follows = function (id, cb) {
  return sbot_query({query: [
    makeQuery(id, {$prefix:"@"}),
    {"$map": ['value', 'content', 'contact']}
  ]})
}

exports.followers = function (id) {
  return sbot_query({query: [
    makeQuery({$prefix:"@"}, id),
    {"$map": ['value', 'author']}
  ]})
}

exports.follower_of = function (source, dest, cb) {
  pull(
    sbot_query({query: [
      makeQuery(source, dest),
      {$map: ['value', 'content', 'following']}
    ]}),
    pull.collect(function (err, ary) {
      if(err) return cb(err)
      else cb(null, ary.pop()) //will be true, or undefined/false
    })
  )
}



