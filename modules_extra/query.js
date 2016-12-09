var h = require('hyperscript')
var pull = require('pull-stream')
var HJSON = require('hjson')

//var sbot_query = require('../plugs').first(exports.sbot_query = [])

exports.needs = { sbot_query: 'first' }

exports.gives = {
  menu_items: true,
  builtin_tabs: true,
  screen_view: true
}

exports.create = function (api) {

  return {
    menu_items: function () {
      return h('a', {href:'#/query'}, '/query')
    },

    builtin_tabs: function () {
      return ['/query']
    },

    screen_view: function (path) {
      if(path != '/query') return
      var output, status, editor, stream, query

      function parse () {
        try {
          query = HJSON.parse(editor.value)
        } catch (err) {
          return status.textContent = err.message
        }
        status.textContent = 'okay'
      }

      return h('div.column.scroll',
        editor = h('textarea', {style: 'min-height:100px;', oninput: parse, onkeydown: function (e) {
          if(!(e.keyCode === 13 && e.ctrlKey)) return
      
          status.textContent = 'running...'
          parse()
          output.innerHTML = ''
          if(stream) stream.abort()

          console.log(query)

          stream = pull(
            api.sbot_query({query: query, limit: 100}),
            pull.drain(function (data) {
              output.appendChild(h('pre.query__data',
                JSON.stringify(data, null, 2)
              ))
            }, function (err) {
              if(err) status.textContent = err.stack
            })
          )
        }}),
        status = h('div.query__status'),
        output = h('div.column.query__output', {style: 'overflow-y: scroll;'})
      )
    }
  }
}
