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

exports.first = first
exports.decorate = decorate

exports.next = function (createStream, opts, range, property) {

  range = range || opts.reverse ? 'lt' : 'gt'
  property = property || 'timestamp'

  var last = null
  return Next(function () {
    if(last) {
      opts[range] = last[property]
    }
    return pull(
      createStream(opts),
      pull.through(function (msg) {
        if(!msg.sync) last = msg
      })
    )
  })
}

exports.firstPlug = function (plugs, fn) {
  if(!Array.isArray(plugs)) throw new Error('plugs must be an array')
  var args = [].slice.call(arguments)
  var plugs = args.shift()
  return exports.first(plugs, function (fn) {
    return fn.apply(null, args)
  })
}

