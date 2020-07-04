const { h, when, send, resolve, Value, Array: MutantArray, computed } = require('mutant')
const nest = require('depnest')
const ssbMentions = require('ssb-mentions')
const extend = require('xtend')
const addSuggest = require('suggest-box')
const blobFiles = require('ssb-blob-files')
const get = require('lodash/get')
const datSharedFiles = require('dat-shared-files')
const { isFeed } = require('ssb-ref')

exports.gives = nest('message.html.compose')

exports.needs = nest({
  'about.async.suggest': 'first',
  'channel.async.suggest': 'first',
  'emoji.async.suggest': 'first',
  'meme.async.suggest': 'first',
  'message.html.confirm': 'first',
  'drafts.sync.get': 'first',
  'drafts.sync.set': 'first',
  'drafts.sync.remove': 'first',
  'settings.obs.get': 'first',
  'sbot.obs.connection': 'first'
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
      disabled: meta.channel ? true : undefined,
      title: meta.channel ? 'Reply is in same channel as original message' : undefined
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
      'ev-paste': ev => {
        const files = get(ev, 'clipboardData.files')
        if (!files || !files.length) return
        const opts = {
          stripExif: api.settings.obs.get('patchbay.removeExif', true),
          isPrivate
        }

        blobFiles(files, api.sbot.obs.connection, opts, afterBlobed)
      },
      placeholder
    })

    textArea.publish = publish // TODO: fix - clunky api for the keyboard shortcut to target

    // load draft
    let draft = api.drafts.sync.get(draftLocation)
    if (typeof draft === 'string') {
      textArea.value = draft
      hasContent.set(true)
    }

    var isPrivate = location.page === 'private' ||
      (location.key && !location.value) ||
      (location.value && location.value.private)

    var warningMessages = MutantArray([])
    var warning = computed(warningMessages, msgs => {
      if (!msgs.length) return

      return h('section.warnings', msgs.map((m, i) => {
        return h('div.warning', [
          h('i.fa.fa-exclamation-triangle'),
          h('div.message', m),
          h('i.fa.fa-times', { 'ev-click': () => warningMessages.deleteAt(i) })
        ])
      }))
    })

    var ssbBlobInput = h('input -ssb', {
      type: 'file',
      // accept,
      attributes: { multiple: true, title: 'Add files as blobs' },
      'ev-click': () => hasContent.set(true),
      'ev-change': (ev) => {
        warningMessages.set([])

        const files = ev.target.files
        const opts = {
          stripExif: api.settings.obs.get('patchbay.removeExif', true),
          isPrivate
        }
        blobFiles(files, api.sbot.obs.connection, opts, afterBlobed)
      }
    })
    function afterBlobed (err, result) {
      if (err) {
        console.error(err)
        warningMessages.push(err.message)
        return
      }

      files.push(result)
      filesById[result.link] = result

      const pos = textArea.selectionStart
      const embed = result.type.match(/^image/) ? '!' : ''
      const spacer = embed ? '\n' : ' '
      const insertLink = spacer + embed + '[' + result.name + ']' + '(' + result.link + ')' + spacer

      textArea.value = textArea.value.slice(0, pos) + insertLink + textArea.value.slice(pos)

      console.log('added:', result)
    }

    var datBlobInput = h('input -dat', {
      type: 'file',
      attributes: { multiple: true, title: 'Add files as dat link' },
      'ev-click': () => hasContent.set(true),
      'ev-change': (ev) => {
        const filenames = Array.from(ev.target.files).map(f => f.path)
        datSharedFiles.shareFiles(filenames, (err, datLink) => {
          if (err) {
            console.error(err)
            return
          }

          const pos = textArea.selectionStart
          let insertLink = datLink
          if (filenames.length === 1) { insertLink = '[' + ev.target.files[0].name + ']' + '(' + datLink + '/' + ev.target.files[0].name + ')' }

          textArea.value = textArea.value.slice(0, pos) + insertLink + textArea.value.slice(pos)
        })
      }
    })

    var isPublishing = Value(false)
    var publishBtn = h('button', { 'ev-click': publish, disabled: isPublishing }, isPrivate ? 'Reply' : 'Publish')

    var actions = h('section.actions', [
      h('div.attach', [
        h('i.fa.fa-paperclip'),
        h('div.attachers', [
          h('div.attacher', { 'ev-click': () => ssbBlobInput.click() }, [
            h('i.fa.fa-file-o'),
            h('div.label', 'small files'),
            h('div.subtext', '< 5MB')
          ]),
          h('div.attacher', { 'ev-click': () => datBlobInput.click() }, [
            h('i.fa.fa-file-archive-o'),
            h('div.label', 'large files'),
            h('div.subtext', 'DAT archive, (BETA)')
          ]),
          ssbBlobInput,
          datBlobInput
        ])
      ]),
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

    if (location.action === 'quote') { composer.addQuote(location.value) }

    addSuggest(channelInput, (inputText, cb) => {
      if (inputText[0] === '#') {
        api.channel.async.suggest(inputText.slice(1), cb)
      }
    }, { cls: 'PatchSuggest' })
    channelInput.addEventListener('suggestselect', ev => {
      channelInput.value = ev.detail.id // HACK : this over-rides the markdown value
    })

    addSuggest(textArea, (inputText, cb) => {
      const char = inputText[0]
      const wordFragment = inputText.slice(1)

      if (char === '@') api.about.async.suggest(wordFragment, feedIdsInThread, cb)
      if (char === '#') api.channel.async.suggest(wordFragment, cb)
      if (char === ':') api.emoji.async.suggest(wordFragment, cb)
      if (char === '&') api.meme.async.suggest(wordFragment, cb)
    }, { cls: 'PatchSuggest' })

    return composer

    // scoped

    function publish () {
      if (resolve(isPublishing)) return
      isPublishing.set(true)

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
      else content.recps = content.recps.map(r => {
        return r.link && isFeed(r.link) ? r.link : r
      })

      try {
        if (typeof prepublish === 'function') {
          content = prepublish(content)
        }
      } catch (err) {
        isPublishing.set(false)
        if (cb) cb(err)
        else throw err
      }

      return api.message.html.confirm(content, done)

      function done (err, msg) {
        isPublishing.set(false)
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
