var h = require('hyperscript')
var pull = require('pull-stream')

function all(stream, cb) {
  pull(stream, pull.collect(cb))
}

exports.avatar = 
function name (id, sbot) {
  var n = h('span', id.substring(0, 10))
  //choose the most popular name for this person.
  //for anything like this you'll see I have used sbot.links2
  //which is the ssb-links plugin. as you'll see the query interface
  //is pretty powerful!
  //TODO: "most popular" name is easily gameable.
  //must come up with something better than this.
  /*
    filter(rel: ['mentions', prefix('@')])
      .reduce(name: rel[1], value: count())
  */

  all(
    sbot.links2.read({query: [
      {$filter: {rel: ['mentions', {$prefix: '@'}], dest: id}},
      {$reduce: { name: ['rel', 1], count: {$count: true}
      }}
    ]}),
    function (err, names) {
      if(err) throw err
      console.log(names)
      n.textContent = names.reduce(function (max, item) {
        return max.count > item.count ? max : item
      }, {name: id.substring(0, 10), count: 0}).name
    })

  return n

}

