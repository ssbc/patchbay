const { h, when, send, resolve, Value, computed } = require('mutant')
const nest = require('depnest')
const mentions = require('ssb-mentions')
const extend = require('xtend')
const addSuggest = require('suggest-box')

exports.needs = nest({
  'about.async.suggest': 'first',
  'blob.html.input': 'first',
  'channel.async.suggest': 'first',
  'emoji.sync': {
    names: 'first',
    url: 'first'
  },
  'message.async.publish': 'first'
})

exports.gives = nest('message.html.compose')

exports.create = function (api) {
  return nest('message.html.compose', compose)

  function compose ({ shrink = true, meta, prepublish, placeholder = 'Write a message' }, cb) {
    var files = []
    var filesById = {}
    var focused = Value(false)
    var hasContent = Value(false)
    var getProfileSuggestions = api.about.async.suggest()
    var getChannelSuggestions = api.channel.async.suggest()

    var blurTimeout = null

    var expanded = computed([shrink, focused, hasContent], (shrink, focused, hasContent) => {
      if (!shrink || hasContent) return true

      return focused
    })

    var textArea = h('textarea', {
      'ev-input': () => hasContent.set(!!textArea.value),
      'ev-blur': () => {
        clearTimeout(blurTimeout)
        blurTimeout = setTimeout(() => focused.set(false), 200)
      },
      'ev-focus': send(focused.set, true),
      placeholder
    })

    var fileInput = api.blob.html.input(file => {
      files.push(file)
      filesById[file.link] = file

      var embed = file.type.match(/^image/) ? '!' : ''
      var spacer = embed ? '\n' : ' '
      var insertLink = spacer + embed + '[' + file.name + ']' + '(' + file.link + ')' + spacer

      var pos = textArea.selectionStart
      textArea.value = textArea.value.slice(0, pos) + insertLink + textArea.value.slice(pos)

      console.log('added:', file)
    })

    fileInput.onclick = () => hasContent.set(true)

    var publishBtn = h('button', { 'ev-click': publish }, 'Publish')

    var actions = h('section.actions', [
      fileInput,
      publishBtn
    ])

    var composer = h('Compose', {
      classList: when(expanded, '-expanded', '-contracted')
    }, [
      textArea,
      actions
    ])

    addSuggest(textArea, (inputText, cb) => {
      if (inputText[0] === '@') {
        cb(null, getProfileSuggestions(inputText.slice(1)))
      } else if (inputText[0] === '#') {
        cb(null, getChannelSuggestions(inputText.slice(1)))
      } else if (inputText[0] === ':') {
        // suggest emojis
        var word = inputText.slice(1)
        if (word[word.length - 1] === ':') {
          word = word.slice(0, -1)
        }
        // TODO: when no emoji typed, list some default ones
        cb(null, api.emoji.sync.names().filter(function (name) {
          return name.slice(0, word.length) === word
        }).slice(0, 100).map(function (emoji) {
          return {
            image: api.emoji.sync.url(emoji),
            title: emoji,
            subtitle: emoji,
            value: ':' + emoji + ':'
          }
        }))
      }
    }, {cls: 'SuggestBox'})

    return composer

    // scoped

    function publish () {
      publishBtn.disabled = true

      meta = extend(resolve(meta), {
        text: textArea.value,
        mentions: mentions(textArea.value).map(mention => {
          // merge markdown-detected mention with file info
          var file = filesById[mention.link]
          if (file) {
            if (file.type) mention.type = file.type
            if (file.size) mention.size = file.size
          }
          return mention
        })
      })

      try {
        if (typeof prepublish === 'function') {
          meta = prepublish(meta)
        }
      } catch (err) {
        publishBtn.disabled = false
        if (cb) cb(err)
        else throw err
      }

      return api.message.async.publish(meta, done)

      function done (err, msg) {
        publishBtn.disabled = false
        if (err) throw err
        else if (msg) textArea.value = ''
        if (cb) cb(err, msg)
      }
    }
  }
}

