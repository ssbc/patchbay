var u = require('./util')

exports.first = function first(plug) {
  return function () {
    var args = [].slice.call(arguments)
    return u.firstPlug(plug, args)
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



