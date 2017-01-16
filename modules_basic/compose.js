'use strict'
const fs = require('fs')
const h = require('../h')
const u = require('../util')
const suggest = require('suggest-box')
const mentions = require('ssb-mentions')
const cont = require('cont')

exports.needs = {
  suggest_mentions: 'map', //<-- THIS MUST BE REWRITTEN
  publish: 'first',
  message_content: 'first',
  message_confirm: 'first',
  file_input: 'first'
}

exports.gives = {
  'message_compose': true,
  'mcss': true
}

exports.create = function (api) {
  return {
    message_compose,
    mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
  }

  /*
    opts can take

      placeholder: string. placeholder text, defaults to "Write a message"
      prepublish: function. called before publishing a message.
      shrink: boolean. set to false, to make composer not shrink (or hide controls) when unfocused.
  */

  function message_compose (meta = {}, opts = {}, cb) {
    if(!meta.type) throw new Error('message must have type')

    if('function' === typeof cb) {
      if('function' === typeof opts) {
        opts = {prepublish: opts}
      }
    }
    opts.prepublish = opts.prepublish || id

    var actions

    var textArea = h('textarea', {
      placeholder: opts.placeholder || 'Write a message'
    })

    if(opts.shrink !== false) {
      var blur
      textArea.addEventListener('focus', () => {
        clearTimeout(blur)
        if(!textArea.value) {
          composer.className = 'Compose -expanded'
        }
      })
      textArea.addEventListener('blur', () => {
        //don't shrink right away, so there is time
        //to click the publish button.
        clearTimeout(blur)
        blur = setTimeout(() => {
          if(textArea.value) return
          composer.className = 'Compose -contracted'
        }, 300)
      })
    }

    textArea.addEventListener('keydown', ev => {
      if(ev.keyCode === 13 && ev.ctrlKey) publish()
    })

    var files = []
    var filesById = {}

    function publish() {
      publishBtn.disabled = true
      var content
      try {
        content = JSON.parse(textArea.value)
      } catch (err) {
        meta.text = textArea.value
        meta.mentions = mentions(textArea.value).map(mention => {
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
        return api.message_confirm(meta, done)
      }

      api.message_confirm(content, done)

      function done (err, msg) {
        publishBtn.disabled = false
        if(err) return alert(err.stack)
        else if (msg) textArea.value = ''

        if (cb) cb(err, msg)
      }
    }

    var fileInput = api.file_input(file => {
      files.push(file)
      filesById[file.link] = file

      var embed = file.type.indexOf('image/') === 0 ? '!' : ''

      textArea.value += embed + '['+file.name+']('+file.link+')'
      composer.className = 'Compose -expanded'
      console.log('added:', file)
    })
    var publishBtn = h('button', {'ev-click': publish}, 'Publish' )
    var actions = h('section.actions', [
      fileInput, publishBtn
    ])

    var composer = h('Compose', {
      className: opts.shrink === false ? '-expanded' : '-contracted'
    }, [
      textArea,
      actions
    ])

    suggest(textArea, (name, cb) => {
      cont.para(api.suggest_mentions(name))
        ((err, ary) => {
          cb(null, ary.reduce((a, b) => {
            if(!b) return a
            return a.concat(b)
          }, []))
        })
    }, {})

    return composer
  }

}

function id (e) { return e }
