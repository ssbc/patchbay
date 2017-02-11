const h = require('hyperscript')

exports.needs = {
  about: {
    name: 'first',
    image: 'first',
    signifier: 'first'
  }
}

exports.gives = {
  about: {
    image_name_link: true,
    image_link: true,
    link: true,
    name_link: true
  }
}

exports.create = function (api) {
  return {
    about: {
      link,
      image_name_link,
      image_link,
      name_link
    }
  }

  function link (author, element) {
    var link = h('a.avatar', {href: "#"+author, title: author}, element)

    api.about.signifier(author, function (_, names) {
      if(names.length)
        link.title = names[0].name + '\n  '+author
    })

    return link
  }

  function image_name_link (author, classes) {
    return link(author, [
      api.about.image(author, classes),
      api.about.name(author)
    ])
  }

  function image_link (author, classes) {
    return link(author, api.about.image(author, classes))
  }

  function name_link (author, classes) {
    return link(author, api.about.name(author))
  }
}

