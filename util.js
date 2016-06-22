var pull = require('pull-stream')
var Next = require('pull-next')

function first (list, test) {
  for(var i in list) {
    var value = test(list[i], i, list)
    if(value) return value
  }
}

function decorate (list, value, caller) {
  caller = caller || function (d,e,v) { return d(e, v) }

  return list.reduce(function (element, decorator) {
    return caller(decorator, element, value) || element
  }, null)
}

function get(obj, path) {
  if(obj == null) return obj
  if('string' === typeof path) return obj[path]
  for(var i = 0; i < path.length; i++) {
    obj = obj[path[i]]
    if(obj == null) return
  }
  return obj

}

exports.first = first
exports.decorate = decorate

exports.next = function (createStream, opts, property, range) {

  range = range || opts.reverse ? 'lt' : 'gt'
  property = property || 'timestamp'

  var last = null, count = -1
  return Next(function () {
    if(last) {
      if(count === 0) return
      var value = opts[range] = get(last, property)
      if(value === stop) return null
    }
    return pull(
      createStream(opts),
      pull.through(function (msg) {
        count ++
        if(!msg.sync) last = msg
      }, function (err) {
        //retry on errors...
        if(err) count = -1
      })
    )
  })
}

exports.firstPlug = function (plugs) {
  if(!Array.isArray(plugs)) throw new Error('plugs must be an array')
  var args = [].slice.call(arguments)
  var plugs = args.shift()
  return exports.first(plugs, function (fn) {
    return fn.apply(null, args)
  })
}

