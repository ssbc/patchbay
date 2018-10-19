const nest = require('depnest')
const { h, Value, when, computed, resolve } = require('mutant')
const Abort = require('pull-abortable')
const pull = require('pull-stream')
const addSuggest = require('suggest-box')
const get = require('lodash/get')
const isEqual = require('lodash/isEqual')
const isEmpty = require('lodash/isEmpty')
const { isFeed } = require('ssb-ref')

exports.gives = nest('app.html.filter')

exports.needs = nest({
  'about.async.suggest': 'first',
  'channel.async.suggest': 'first',
  'contact.obs.following': 'first',
  'channel.obs.subscribed': 'first',
  'keys.sync.id': 'first',
  'settings.obs.get': 'first',
  'settings.sync.set': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.filter': Filter
  })

  function Filter (draw) {
    const showFilters = Value(false)

    const myId = api.keys.sync.id()
    const peopleIFollow = api.contact.obs.following(myId)
    const channelsIFollow = api.channel.obs.subscribed(myId)

    const filterSettings = api.settings.obs.get('filter', { exclude: {} })

    const channelInput = h('input', {
      value: filterSettings().exclude.channels,
      'ev-keyup': (ev) => {
        var text = ev.target.value
        if (text.length === 0 || ev.which === 13) {
          api.settings.sync.set({
            filter: {
              exclude: {
                channels: text
              }
            }
          })
          draw()
        }
      }
    })

    var userId = Value('')
    userId(id => {
      userInput.value = id
      draw()
    })
    const userInput = h('input', {
      'ev-input': (ev) => {
        const { value } = ev.target
        if (value === resolve(userId)) return // stops infinite loop

        if (isFeed(value)) userId.set(value)
        else if (isEmpty(value)) userId.set('')
      }
    })

    const isFiltered = computed(filterSettings, (filterSettings) => {
      const _settings = Object.assign({}, filterSettings)
      delete _settings.defaults

      return !isEqual(_settings, filterSettings.defaults)
    })

    const filterMenu = h('Filter', [
      when(isFiltered, h('i.custom')),
      h('i.fa.fa-filter', {
        classList: when(showFilters, '-active'),
        'ev-click': () => showFilters.set(!showFilters())
      }),
      h('i.fa.fa-angle-up', { 'ev-click': draw }),
      h('div.options', { className: when(showFilters, '', '-hidden') }, [
        h('header', [
          'Filter',
          h('i.fa.fa-filter')
        ]),
        h('section', [
          h('div.users', [
            toggle({ type: 'peopleAndChannelsIFollow', filterGroup: 'only', label: 'Only people & channels I follow' }),
            h('div.user-filter', [
              h('label', 'Only this user (temporary filter):'),
              userInput
            ])
          ]),
          h('div.channels', [
            h('label', 'Exclude channels'),
            channelInput
          ]),
          h('div.message-types', [
            h('header', 'Show messages'),
            toggle({ type: 'post' }),
            toggle({ type: 'like' }),
            toggle({ type: 'about' }),
            toggle({ type: 'contact' }),
            toggle({ type: 'channel' }),
            toggle({ type: 'pub' }),
            toggle({ type: 'private' }),
            toggle({ type: 'chess' })
          ]),
          h('div.root-messages', [
            toggle({ type: 'rootMessages', filterGroup: 'only', label: 'Root messages only' })
          ])
        ])
      ])
    ])

    function toggle ({ type, filterGroup, label }) {
      label = label || type
      filterGroup = filterGroup || 'show'

      const state = computed(filterSettings, settings => get(settings, [filterGroup, type]))
      const handleClick = () => {
        const currentState = state()

        // TODO use some lodash tool ?
        api.settings.sync.set({
          filter: {
            [filterGroup]: {
              [type]: !currentState
            }
          }
        })

        draw()
      }

      return h('FilterToggle', { 'ev-click': handleClick }, [
        h('label', label),
        h('i', { classList: when(state, 'fa fa-check-square-o', 'fa fa-square-o') })
      ])
    }

    addSuggest(channelInput, (inputText, cb) => {
      if (inputText[0] === '#') {
        api.channel.async.suggest(inputText.slice(1), cb)
      }
    }, { cls: 'PatchSuggest' })
    channelInput.addEventListener('suggestselect', ev => {
      const channels = channelInput.value.trim()

      api.settings.sync.set({ filter: { exclude: { channels: channels } } })

      draw()
    })

    addSuggest(userInput, (inputText, cb) => {
      inputText = inputText.replace(/^@/, '')
      api.about.async.suggest(inputText, cb)
    }, { cls: 'PatchSuggest' })
    userInput.addEventListener('suggestselect', ev => userId.set(ev.detail.id))

    function followFilter (msg) {
      if (!filterSettings().only.peopleAndChannelsIFollow) return true

      return (msg.value && Array.from(peopleIFollow()).concat(myId).includes(msg.value.author)) ||
             (msg.value && msg.value.content && Array.from(channelsIFollow()).includes(msg.value.content.channel))
    }

    function userFilter (msg) {
      const id = resolve(userId)
      if (!id) return true

      return msg.value.author === id
    }

    function rootFilter (msg) {
      if (!filterSettings().only.rootMessages) return true

      return !msg.value.content.root
    }

    function channelFilter (msg) {
      var filters = filterSettings().exclude.channels
      if (!filters) return true
      filters = filters.split(' ').map(c => c.slice(1))

      return msg.value.content && !filters.includes(msg.value.content.channel)
    }

    function messageFilter (msg) {
      var { type } = msg.value.content
      if (/^chess/.test(type)) {
        type = 'chess'
      }

      if (typeof msg.value.content === 'string') {
        type = 'private'
      }

      return get(filterSettings(), ['show', type], true)
    }

    var downScrollAborter

    function filterDownThrough () {
      return pull(
        downScrollAborter,
        pull.filter(msg => msg),
        pull.filter(followFilter),
        pull.filter(userFilter),
        pull.filter(rootFilter),
        pull.filter(channelFilter),
        pull.filter(messageFilter)
      )
    }

    var upScrollAborter

    function filterUpThrough () {
      return pull(
        upScrollAborter,
        pull.filter(msg => msg),
        pull.filter(followFilter),
        pull.filter(userFilter),
        pull.filter(rootFilter),
        pull.filter(channelFilter),
        pull.filter(messageFilter)
      )
    }

    function resetFeed ({ container, content }) {
      if (typeof upScrollAborter === 'function') {
        upScrollAborter.abort()
        downScrollAborter.abort()
      }
      upScrollAborter = Abort()
      downScrollAborter = Abort()

      container.scroll(0)
      content.innerHTML = ''
    }

    return {
      filterMenu,
      filterDownThrough,
      filterUpThrough,
      resetFeed
    }
  }
}
