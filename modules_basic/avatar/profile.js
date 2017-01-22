const fs = require('fs')
const h = require('../../h')
const pull = require('pull-stream')
const { unique, collect, drain } = pull


exports.needs = {
  avatar_image_link: 'first',
  avatar_action: 'map',
  avatar_edit: 'first',
  follows: 'first',
  followers: 'first'
}

exports.gives = {
  avatar_profile: true,
  mcss: true
}

exports.create = function (api) {
  return { 
    avatar_profile,
    mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
  }

  function avatar_profile (id) {

    var friends_el = h('div.friends', [
      h('header', 'Friends')
    ])
    var follows_el = h('div.follows', [
      h('header', 'Follows')
    ])
    var followers_el = h('div.followers', [
      h('header', 'Followers')
    ])
    var a, b

    pull(
      api.follows(id),
      unique(), 
      collect((err, ary = []) => { 
        a = ary; next() 
      })
    )
    pull(
      api.followers(id),
      unique(), 
      collect((err, ary = {}) => {
        b = ary; next()
      })
    )

    function next () {
      if(!(a && b)) return
      var _c = [], _a = [], _b = []

      a.forEach(id => {
        if(!~b.indexOf(id)) _a.push(id)
        else               _c.push(id)
      })
      b.forEach(id => {
        if(!~_c.indexOf(id)) _b.push(id)
      })

      add(_c, friends_el)
      add(_a, follows_el)
      add(_b, followers_el)

      function add (ary, el) {
        ary.forEach(id => el.appendChild(api.avatar_image_link(id)) )
      }
    }


    return h('Profile', [
      h('section.edit', api.avatar_edit(id)),
      h('section.action', api.avatar_action(id)),
      h('section.relationships', [
        friends_el,
        follows_el,
        followers_el
      ])
    ])
  }

}
