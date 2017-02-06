const h = require('hyperscript')

exports.needs = {
  about_name: 'first',
  about_image: 'first',
  signifier: 'first'
}

exports.gives = {
  about_image_name_link: true,
  about_image_link: true,
  about_link: true,
  about_name_link: true
}

exports.create = function (api) {
  return {
    about_link,
    about_image_name_link,
    about_image_link,
    about_name_link
  }

  function about_link (author, element) {
    var link = h('a.avatar', {href: "#"+author, title: author}, element)

    api.signifier(author, function (_, names) {
      if(names.length)
        link.title = names[0].name + '\n  '+author
    })

    return link
  }

  function about_image_name_link (author, classes) {
    return about_link(author, [
      api.about_image(author, classes),
      api.about_name(author)
    ])
  }

  function about_image_link (author, classes) {
    return about_link(author, api.about_image(author, classes))
  }

  function about_name_link (author, classes) {
    return about_link(author, api.about_name(author))
  }
}

