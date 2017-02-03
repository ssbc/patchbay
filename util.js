var pull = require('pull-stream')
var Next = require('pull-next')

function get (obj, path) {
  if(!obj) return undefined
  if('string' === typeof path) return obj[path]
  if(Array.isArray(path)) {
    for(var i = 0; obj && i < path.length; i++)
      obj = obj[path[i]]
    return obj
  }
}

function clone (obj) {
  var _obj = {}
  for(var k in obj) _obj[k] = obj[k]
  return _obj
}

exports.next = function (createStream, opts, property, range) {

  range = range || (opts.reverse ? 'lt' : 'gt')
  property = property || 'timestamp'

  var last = null, count = -1
  return Next(function () {
    if(last) {
      if(count === 0) return
      var value = opts[range] = get(last, property)
      if(value == null) return
      last = null
    }
    return pull(
      createStream(clone(opts)),
      pull.through(function (msg) {
        count ++
        if(!msg.sync) {
          last = msg
        }
      }, function (err) {
        //retry on errors...
        if(err) return count = -1
        //end stream if there were no results
        if(last == null) last = {}
      })
    )
  })
}


exports.ScrollNotify = function (container, scroller) {
  var cl = '-notify'
  scroller.observ((len) => {
    if(pageClassList().contains(cl) != (len != 0)) {
      if(len) pageClassList().add(cl)
      else pageClassList().remove(cl)
    }
  })

  container.addEventListener('focus', () => {
    scroller.visible()
    pageClassList().remove(cl)
  })

  function pageClassList () {
    return container.parentNode.classList
  }

  return scroller
}
