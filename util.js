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
