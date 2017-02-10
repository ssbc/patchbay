'use strict'
const fs = require('fs')
const h = require('../h')
const { Value, when } = require('mutant')
const mentions = require('ssb-mentions')

exports.needs = {
  suggest_mentions: 'map', //<-- THIS MUST BE REWRITTEN
  suggest_channel: 'map',
  build_suggest_box: 'first',
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

    const isExpanded = Value(opts.shrink === false)

    var textArea = h('textarea', {
      placeholder: opts.placeholder || 'Write a message'
    })

    var channelInput = h('input.channel', {
      placeholder: '#channel (optional)',
      value: meta.channel ? `#${meta.channel}` : '',
      disabled: meta.channel ? true : false,
      title: meta.channel ? 'Reply is in same channel as original message' : '',
    })

    channelInput.addEventListener('keyup', (e) => {
      e.target.value = e.target.value
        .replace(/^#*([\w@%&])/, '#$1')
    })

    if(opts.shrink !== false) {
      isExpanded.set(false)
      var blur

      textArea.addEventListener('focus', () => {
        clearTimeout(blur)
        if(!textArea.value) {
          isExpanded.set(true)
        }
      })
      textArea.addEventListener('blur', () => {
        //don't shrink right away, so there is time
        //to click the publish button.
        clearTimeout(blur)
        blur = setTimeout(() => {
          if(textArea.value) return
          isExpanded.set(false)
        }, 300)
      })
      channelInput.addEventListener('focus', () => {
        clearTimeout(blur)
        if (!textArea.value) {
          isExpanded.set(true)
        }
      })
      channelInput.addEventListener('blur', () => {
        clearTimeout(blur)
        blur = setTimeout(() => {
          if (textArea.value || channelInput.value) return
          isExpanded.set(false)
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
        meta.channel = (channelInput.value.startsWith('#') ?
          channelInput.value.substr(1).trim() : channelInput.value.trim()) || null
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
      var spacer = embed ? '\n' : ' '
      var insertLink = spacer + embed + '[' + file.name + ']' + '(' + file.link + ')' + spacer

      var pos = textArea.selectionStart
      textArea.value = textArea.value.slice(0, pos) + insertLink + textArea.value.slice(pos)

      isExpanded.set(true)
      console.log('added:', file)
    })
    var publishBtn = h('button', {'ev-click': publish}, 'Publish' )
    var actions = h('section.actions', [ fileInput, publishBtn ])

    api.build_suggest_box(textArea, api.suggest_mentions)
    api.build_suggest_box(channelInput, api.suggest_channel)

    var composer = h('Compose', {
      classList: [ when(isExpanded, '-expanded', '-contracted') ]
    }, [
      channelInput,
      textArea,
      actions
    ])

    return composer
  }

}

function id (e) { return e }
