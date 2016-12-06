exports.first = function first(plug) {
  return function () {
    var args = [].slice.call(arguments)
    for(var i = 0; i < plug.length; i++) {
      var val = plug[i].apply(null, args)
      if(val) return val
    }
  }
}

exports.map = function (plug) {
  return function () {
    var args = [].slice.call(arguments)
    return plug.map(function (fn) {
      if(fn) return fn.apply(null, args)
    }).filter(Boolean)
  }
}

exports.asyncConcat = function (plug) {
  return function () {
    var args = [].slice.call(arguments)
    var cb = args.pop()
    var allResults = []
    var waiting = plug.length
    plug.forEach(function (fn) {
      if (!fn) return next()
      fn.apply(null, args.concat(next))
    })
    function next(err, results) {
      if (err) {
        waiting = 0
        return cb(err)
      }
      if (results) allResults = allResults.concat(results)
      if (--waiting === 0) cb(null, allResults)
    }
  }
}

