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





