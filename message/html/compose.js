const { h, when, send, resolve, Value, computed } = require('mutant')
const nest = require('depnest')
const ssbMentions = require('ssb-mentions')
const extend = require('xtend')
const addSuggest = require('suggest-box')

exports.gives = nest('message.html.compose')

exports.needs = nest({
  'about.async.suggest': 'first',
  'channel.async.suggest': 'first',
  'emoji.async.suggest': 'first',
  'meme.async.suggest': 'first',
  'blob.html.input': 'first',
  'message.html.confirm': 'first',
  'drafts.sync.get': 'first',
  'drafts.sync.set': 'first',
  'drafts.sync.remove': 'first',
  'settings.obs.get': 'first'
})

exports.create = function (api) {
  return nest({ 'message.html.compose': compose })

  function compose (options, cb) {
    const {
      meta,
      location,
      feedIdsInThread = [],
      prepublish,
      placeholder = 'Write a message',
      shrink = true
    } = options

    if (typeof resolve(meta) !== 'object') throw new Error('Compose needs meta data about what sort of message composer you are making')
    if (!location) throw new Error('Compose expects a unique location so it can save drafts of messages')

    var files = []
    var filesById = {}
    var channelInputFocused = Value(false)
    var textAreaFocused = Value(false)
    var focused = computed([channelInputFocused, textAreaFocused], (a, b) => a || b)
    var hasContent = Value(false)

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

    var draftPerstTimeout = null
    var draftLocation = location
    var textArea = h('textarea', {
      'ev-input': () => {
        hasContent.set(!!textArea.value)
        clearTimeout(draftPerstTimeout)
        draftPerstTimeout = setTimeout(() => {
          api.drafts.sync.set(draftLocation, textArea.value)
        }, 200)
      },
      'ev-blur': () => {
        clearTimeout(blurTimeout)
        blurTimeout = setTimeout(() => textAreaFocused.set(false), 200)
      },
      'ev-focus': send(textAreaFocused.set, true),
      placeholder
    })
    textArea.publish = publish // TODO: fix - clunky api for the keyboard shortcut to target

    // load draft
    let draft = api.drafts.sync.get(draftLocation)
    if (typeof draft === 'string') {
      textArea.value = draft
      hasContent.set(true)
    }

    var isPrivate = location.page == 'private' ||
          (location.key && !location.value) ||
          (location.value && location.value.private)

    var warningMessage = Value(null)
    var warning = h('section.warning',
      { className: when(warningMessage, '-open', '-closed') },
      [
        h('div.warning', warningMessage),
        h('div.close', { 'ev-click': () => warningMessage.set(null) }, 'x')
      ]
    )
    var fileInput = api.blob.html.input(file => {
      const megabytes = file.size / 1024 / 1024
      if (megabytes >= 5) {
        const rounded = Math.floor(megabytes * 100) / 100
        warningMessage.set([
          h('i.fa.fa-exclamation-triangle'),
          h('strong', file.name),
          ` is ${rounded}MB - the current limit is 5MB`
        ])
        return
      }

      files.push(file)
      filesById[file.link] = file

      const pos = textArea.selectionStart
      const embed = file.type.match(/^image/) ? '!' : ''
      const spacer = embed ? '\n' : ' '
      const insertLink = spacer + embed + '[' + file.name + ']' + '(' + file.link + ')' + spacer

      textArea.value = textArea.value.slice(0, pos) + insertLink + textArea.value.slice(pos)

      console.log('added:', file)
    }, { private: isPrivate, removeExif: api.settings.obs.get('patchbay.removeExif', true) })

    fileInput.onclick = () => hasContent.set(true)

    var publishBtn = h('button', { 'ev-click': publish }, isPrivate ? 'Reply' : 'Publish')

    var actions = h('section.actions', [
      fileInput,
      publishBtn
    ])

    var composer = h('Compose', {
      classList: when(expanded, '-expanded', '-contracted')
    }, [
      channelInput,
      textArea,
      warning,
      actions
    ])

    composer.addQuote = function (data) {
      try {
        if (typeof data.content.text === 'string') {
          var text = data.content.text
          textArea.value += '> ' + text.replace(/\r\n|\r|\n/g, '\n> ') + '\r\n\n'
          hasContent.set(!!textArea.value)
        }
      } catch (err) {
        // object not have text or content
      }
    }

    if (location.action == 'quote') {
      composer.addQuote(location.value)
    }

    addSuggest(channelInput, (inputText, cb) => {
      if (inputText[0] === '#') {
        api.channel.async.suggest(inputText.slice(1), cb)
      }
    }, {cls: 'PatchSuggest'})
    channelInput.addEventListener('suggestselect', ev => {
      channelInput.value = ev.detail.id  // HACK : this over-rides the markdown value
    })

    addSuggest(textArea, (inputText, cb) => {
      const char = inputText[0]
      const wordFragment = inputText.slice(1)

      if (char === '@') api.about.async.suggest(wordFragment, feedIdsInThread, cb)
      if (char === '#') api.channel.async.suggest(wordFragment, cb)
      if (char === ':') api.emoji.async.suggest(wordFragment, cb)
      if (char === '&') api.meme.async.suggest(wordFragment, cb)
    }, {cls: 'PatchSuggest'})

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
        else if (msg) {
          textArea.value = ''
          api.drafts.sync.remove(draftLocation)
        }
        if (cb) cb(err, msg)
      }
    }
  }
}
