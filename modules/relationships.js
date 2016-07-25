
var plugs = require('../plugs')

var sbot_links2 = plugs.first(exports.sbot_links2 = [])

//this is a bit crude, and doesn't actually show unfollows yet.

exports.follows = function (id, cb) {
  return sbot_links2({query: [
    {"$filter": {"source": id, "rel": ["contact", true, false] }},
    {"$map": "dest"}
  ]})
}

exports.followers = function (id) {
  return sbot_links2({query: [
    {"$filter": {"dest": id, "rel": ["contact", true, false] }},
    {"$map": "source"}
  ]})
}



