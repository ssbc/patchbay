var pull = require('pull-stream')
var Next = require('pull-next')

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
      createStream(opts),
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

