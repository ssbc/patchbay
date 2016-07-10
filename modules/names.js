var h = require('hyperscript')
var pull = require('pull-stream')

function all(stream, cb) {
  pull(stream, pull.collect(cb))
}

var plugs = require('../plugs')
var getAvatar = require('ssb-avatar')
var sbot_links2 = plugs.first(exports.sbot_links2 = [])
var sbot_links = plugs.first(exports.sbot_links = [])
var sbot_whoami = plugs.first(exports.sbot_whoami = [])

exports.avatar_name =
function name (id) {
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
    sbot_links2({query: [
      {$filter: {rel: ['mentions', {$prefix: '@'}], dest: id}},
      {$reduce: { name: ['rel', 1], count: {$count: true}
      }}
    ]}),
    function (err, names) {
      if(err) console.error(err), names = []
      //if they have not been mentioned, fallback
      //to patchwork style naming (i.e. self id)
      if(!names.length)
        return sbot_whoami(function (err, me) {
          if (err) return console.error(err)
          getAvatar({links: sbot_links}, me.id, id,
            function (err, avatar) {
              if (err) return console.error(err)
              n.textContent = (avatar.name[0] == '@' ? '' : '@') + avatar.name
            })
        })

      n.textContent = names.reduce(function (max, item) {
        return max.count > item.count || item.name == '@' ? max : item
      }, {name: id.substring(0, 10), count: 0}).name
    })

  return n

}


