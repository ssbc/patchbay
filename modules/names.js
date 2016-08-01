var pull = require('pull-stream')

function all(stream, cb) {
  pull(stream, pull.collect(cb))
}

var plugs = require('../plugs')
var sbot_links2 = plugs.first(exports.sbot_links2 = [])

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
    id: 'dest', name: ['rel', 1], ts: 'ts',
  }
}

var reduce = {
  $reduce: {
    id: "dest",
    name: ["rel", 1],
    rank: {$count: true}
  }
}

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

exports.connection_status = function (err) {
  if(!err) {
    pull(
      sbot_links2({query: [filter, reduce]}),
      pull.collect(function (err, ary) {
          console.log(err, ary)
        if(!err) {
          names = ary
          ready = true
          while(waiting.length) waiting.shift()()
        }
      })
    )

    pull(sbot_links2({query: [filter, map], old: false}), pull.drain(update))
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

