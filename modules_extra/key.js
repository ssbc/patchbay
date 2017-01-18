var h = require('hyperscript')

exports.gives = {
  menu_items: true, screen_view: true
}

exports.create = function (api) {
  return {
    menu_items: function () {
      return h('a', {href: '#/key'}, '/key')
    },
    screen_view: function (path, sbot) {
      if(path === '/key') {
        if(process.title === 'browser') {
          var importKey = h('textarea', {placeholder: 'import an existing public/private key', name: 'textarea'})
          var importRemote = h('textarea', {placeholder: 'import an existing remote', name: 'textarea'})

          return h('div.column.scroller',
            {style: {'overflow':'auto'}},
            h('div.scroller__wrapper',
              h('div.column.scroller__content',
                h('div.message',
                  h('p', {innerHTML: 'Your secret key is: <pre><code>' + localStorage['browser/.ssb/secret'] + '</code></pre>'}),
                  h('form',
                    importKey,
                    h('button', {onclick: function (e){
                      localStorage['browser/.ssb/secret'] = importKey.value.replace(/\s+/g, ' ')
                      alert('Your public/private key has been updated')
                      e.preventDefault()
                    }}, 'Import'),
                  h('p', {innerHTML: 'Your ws remote is: <pre>' + localStorage.remote + '</pre>'}),
                  h('form',
                    importRemote,
                    h('button', {onclick: function (e){
                      localStorage.remote = importRemote.value
                      alert('Your websocket remote has been updated')
                      e.preventDefault()
                    }}, 'Import')
                    )
                  )
                )
              )
            )
          )
        } else { 
          return h('p', 'Your key is saved at .ssb/secret')
        }
      }
    }
  }
}

