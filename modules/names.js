var pull = require('pull-stream')
var many = require('pull-many')
var mfr = require('map-filter-reduce')

function all(stream, cb) {
  pull(stream, pull.collect(cb))
}

var plugs = require('../plugs')
var sbot_links2 = plugs.first(exports.sbot_links2 = [])
var sbot_query = plugs.first(exports.sbot_query = [])

/*
  filter(rel: ['mentions', prefix('@')]) | reduce(name: rel[1], value: count())
*/

var filter = {
  $filter: {
    rel: ["mentions", {$prefix: "@"}]
  }
}
var map = {
  $map: {
    name: ['rel', 1],
    id: 'dest',
    ts: 'ts',
  }
}

var reduce = {
  $reduce: {
    name: 'name',
    id: 'id',
    rank: {$count: true}
  }
}

var filter2 = {
  $filter: {
    value: {
      content: {
        type: "about",
        name: {"$prefix": ""},
        about: {"$prefix": "@"} //better: match regexp.
      }
    }
  }
}

var map2 = {
 $map: {
    name: ["value", "content", "name"],
    id: ['value', 'content', 'about'],
    ts: "timestamp"
  }
}

//union with this query...

var names = []
function update(name) {
  var n = names.find(function (e) {
    return e.id == name.id && e.name == e.name
  })
  if(!n) {
    name.rank = 1
    //this should be inserted at the right place...
    names.push(name)
  }
  else
    n.rank = n.rank += (name.rank || 1)
}

var ready = false, waiting = []

var merge = {
  $reduce: {
    name: 'name',
    id: 'id',
    rank: {$sum: 'rank'},
    ts: {$max: 'ts'}
  }
}

function add_at(stream) {
  return pull(stream, pull.map(function (e) {
      if(!/^@/.test(e.name)) e.name = '@'+e.name
      return e
    })
  )
}

exports.connection_status = function (err) {
  if(!err) {
    pull(
      many([
        sbot_links2({query: [filter, map, reduce]}),
        add_at(sbot_query({query: [filter2, map2, reduce]}))
      ]),
      mfr.reduce(merge),
      pull.collect(function (err, ary) {
        if(!err) {
          names = ary
          ready = true
          while(waiting.length) waiting.shift()()
        }
      })
    )

    pull(many([
      sbot_links2({query: [filter, map], old: false}),
      add_at(sbot_query({query: [filter2, map2], old: false}))
    ]),
    pull.drain(update))
  }
}

function async(fn) {
  return function (value, cb) {
    function go () { cb(null, fn(value)) }
    if(ready) go()
    else waiting.push(go)
  }
}

function rank(ary) {
  return ary.sort(function (a, b) { return b.rank - a.rank })
}

exports.signifier = async(function (id) {
  return rank(names.filter(function (e) { return e.id == id}))
})

exports.signified = async(function (name) {
  var rx = new RegExp('^'+name)
  return rank(names.filter(function (e) { return rx.test(e.name) }))
})





