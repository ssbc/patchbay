var h = require('hyperscript')

exports.needs = {
  signifier: 'first'
}

exports.gives = 'avatar_name'

exports.create = function (api) {

  return function name (id) {

    if('string' !== typeof id)
      throw new Error('avatar id must be a string')

    var n = h('span', id  ? id.substring(0, 10) : JSON.stringify(id))

    //choose the most popular name for this person.
    //for anything like this you'll see I have used sbot.links2
    //which is the ssb-links plugin. as you'll see the query interface
    //is pretty powerful!
    //TODO: "most popular" name is easily gameable.
    //must come up with something better than this.

    api.signifier(id, function (_, names) {
      if(names.length) n.textContent = names[0].name
    })

    return n
  }

}



