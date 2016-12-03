'use strict'
var h = require('hyperscript')
var u = require('../util')
var suggest = require('suggest-box')
var mentions = require('ssb-mentions')
var lightbox = require('hyperlightbox')
var cont = require('cont')

//var plugs = require('../plugs')
//var suggest_mentions= plugs.asyncConcat(exports.suggest_mentions = [])
//var publish         = plugs.first(exports.sbot_publish = [])
//var message_content = plugs.first(exports.message_content = [])
//var message_confirm = plugs.first(exports.message_confirm = [])
//var file_input      = plugs.first(exports.file_input = [])

exports.needs = {
  suggest_mentions: 'map', //<-- THIS MUST BE REWRITTEN
  publish: 'first',
  message_content: 'first',
  message_confirm: 'first',
  file_input: 'first'
}

exports.gives = 'message_compose'

function id (e) { return e }

/*
  opts can take

    placeholder: string. placeholder text, defaults to "Write a message"
    prepublish: function. called before publishing a message.
    shrink: boolean. set to false, to make composer not shrink (or hide controls) when unfocused.
*/

exports.create = function (api) {

  return function (meta, opts, cb) {
    if('function' === typeof cb) {
      if('function' === typeof opts)
        opts = {prepublish: opts}
      }

    if(!opts) opts = {}
    opts.prepublish = opts.prepublish || id

    var accessories
    meta = meta || {}
    if(!meta.type) throw new Error('message must have type')
    var ta = h('textarea', {
      placeholder: opts.placeholder || 'Write a message',
      style: {height: opts.shrink === false ? '200px' : ''}
    })

    if(opts.shrink !== false) {
      var blur
      ta.addEventListener('focus', function () {
        clearTimeout(blur)
        if(!ta.value) {
          ta.style.height = '200px'
        }
        accessories.style.display = 'block'
      })
      ta.addEventListener('blur', function () {
        //don't shrink right away, so there is time
        //to click the publish button.
        clearTimeout(blur)
        blur = setTimeout(function () {
          if(ta.value) return
          ta.style.height = '50px'
          accessories.style.display = 'none'
        }, 200)
      })
    }

    ta.addEventListener('keydown', function (ev) {
      if(ev.keyCode === 13 && ev.ctrlKey) publish()
    })

    var files = []
    var filesById = {}

    function publish() {
      publishBtn.disabled = true
      var content
      try {
        content = JSON.parse(ta.value)
      } catch (err) {
        meta.text = ta.value
        meta.mentions = mentions(ta.value).map(function (mention) {
          // merge markdown-detected mention with file info
          var file = filesById[mention.link]
          if (file) {
            if (file.type) mention.type = file.type
            if (file.size) mention.size = file.size
          }
          return mention
        })
        try {
          meta = opts.prepublish(meta)
        } catch (err) {
          publishBtn.disabled = false
          if (cb) cb(err)
          else alert(err.message)
        }
        return message_confirm(meta, done)
      }

      api.message_confirm(content, done)

      function done (err, msg) {
        publishBtn.disabled = false
        if(err) return alert(err.stack)
        else if (msg) ta.value = ''

        if (cb) cb(err, msg)
      }
    }


    var publishBtn = h('button', 'Publish', {onclick: publish})
    var composer =
      h('div.compose', h('div.column', ta,
        accessories = h('div.row.compose__controls',
          //hidden until you focus the textarea
          {style: {display: opts.shrink === false ? '' : 'none'}},
          api.file_input(function (file) {
            files.push(file)
            filesById[file.link] = file

            var embed = file.type.indexOf('image/') === 0 ? '!' : ''
            ta.value += embed + '['+file.name+']('+file.link+')'
            console.log('added:', file)
          }),
          publishBtn)
        )
      )

    suggest(ta, function (name, cb) {
      cont.para(suggest_mentions.map(function (e) { return e(name) }))
        (function (err, ary) {
          cb(null, ary.reduce(function (a, b) {
            return a.concat(b)
          }))
        })
    }, {})

    return composer

  }

}

