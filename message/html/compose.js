const { h, when, send, resolve, Value, computed } = require('mutant')
const nest = require('depnest')
const ssbMentions = require('ssb-mentions')
const extend = require('xtend')
const addSuggest = require('suggest-box')

exports.gives = nest('message.html.compose')

exports.needs = nest({
  'about.async.suggest': 'first',
  'blob.html.input': 'first',
  'channel.async.suggest': 'first',
  'emoji.sync': {
    names: 'first',
    url: 'first'
  },
  'message.html.confirm': 'first'
})

exports.create = function (api) {
  return nest({ 'message.html.compose': compose })

  function compose ({ shrink = true, meta, prepublish, placeholder = 'Write a message' }, cb) {
    var files = []
    var filesById = {}
    var channelInputFocused = Value(false)
    var textAreaFocused = Value(false)
    var focused = computed([channelInputFocused, textAreaFocused], (a, b) => a || b)
    var hasContent = Value(false)
    var getProfileSuggestions = api.about.async.suggest()
    var getChannelSuggestions = api.channel.async.suggest()

    var blurTimeout = null

    var expanded = computed([shrink, focused, hasContent], (shrink, focused, hasContent) => {
      if (!shrink || hasContent) return true

      return focused
    })

    var channelInput = h('input.channel', {
      'ev-input': () => hasContent.set(!!channelInput.value),
      'ev-keyup': ev => {
        ev.target.value = ev.target.value.replace(/^#*([\w@%&])/, '#$1')
      },
      'ev-blur': () => {
        clearTimeout(blurTimeout)
        blurTimeout = setTimeout(() => channelInputFocused.set(false), 200)
      },
      'ev-focus': send(channelInputFocused.set, true),
      placeholder: '#channel (optional)',
      value: computed(meta.channel, ch => ch ? '#' + ch : null),
      disabled: when(meta.channel, true),
      title: when(meta.channel, 'Reply is in same channel as original message')
    })

    var textArea = h('textarea', {
      'ev-input': () => hasContent.set(!!textArea.value),
      'ev-blur': () => {
        clearTimeout(blurTimeout)
        blurTimeout = setTimeout(() => textAreaFocused.set(false), 200)
      },
      'ev-focus': send(textAreaFocused.set, true),
      placeholder
    })
    textArea.publish = publish // TODO: fix - clunky api for the keyboard shortcut to target

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
      channelInput,
      textArea,
      actions
    ])

    addSuggest(channelInput, (inputText, cb) => {
      if (inputText[0] === '#') {
        cb(null, getChannelSuggestions(inputText.slice(1)))
      }
    }, {cls: 'SuggestBox'})
    channelInput.addEventListener('suggestselect', ev => {
      channelInput.value = ev.detail.id  // HACK : this over-rides the markdown value
    })

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

      const channel = channelInput.value.startsWith('#')
        ? channelInput.value.substr(1).trim()
        : channelInput.value.trim()
      const mentions = ssbMentions(textArea.value).map(mention => {
        // merge markdown-detected mention with file info
        var file = filesById[mention.link]
        if (file) {
          if (file.type) mention.type = file.type
          if (file.size) mention.size = file.size
        }
        return mention
      })

      var content = extend(resolve(meta), {
        text: textArea.value,
        channel,
        mentions
      })

      if (!channel) delete content.channel
      if (!mentions.length) delete content.mentions
      if (content.recps && content.recps.length === 0) delete content.recps

      try {
        if (typeof prepublish === 'function') {
          content = prepublish(content)
        }
      } catch (err) {
        publishBtn.disabled = false
        if (cb) cb(err)
        else throw err
      }

      return api.message.html.confirm(content, done)

      function done (err, msg) {
        publishBtn.disabled = false
        if (err) throw err
        else if (msg) textArea.value = ''
        if (cb) cb(err, msg)
      }
    }
  }
}

