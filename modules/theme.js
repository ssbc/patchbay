var h = require('hyperscript')
var pull = require('pull-stream')
var plugs = require('../plugs')
var cat = require('pull-cat')

var sbot_links2 = plugs.first(exports.sbot_links2 = [])
var avatar_name = plugs.first(exports.avatar_name = [])
var blob_url = require('../plugs').first(exports.blob_url = [])

var link = document.head.appendChild(h('link', {rel: 'stylesheet'}))
var activeTheme

function useTheme(id) {
  activeTheme = id
  link.href = id ? blob_url(id) : ''
  var forms = [].slice.call(document.querySelectorAll('.themes__form'))
  forms.forEach(updateForm)

  var radios = [].slice.call(document.querySelectorAll('input[type=radio]'))
  radios.forEach(function (radio) {
    radio.checked = (radio.value === activeTheme)
  })
}

setImmediate(function () {
  useTheme(localStorage.themeId || '')
})

function themes() {
  return cat([
    pull.values([
      {
        id: '',
        name: 'none',
        feed: ''
      }
    ]),
    pull(
      sbot_links2({
        query: [
          {$filter: {rel: ['mentions', {$prefix: 'patchbay-'}, {$gt: null}]}},
          {$filter: {dest: {$prefix: '&'}}},
          {$map: {id: 'dest', feed: 'source', name: ['rel', 1]}}
        ],
        live: true,
        sync: false,
      }),
      pull.filter(function (link) {
        return /\.css$/.test(link.name)
      })
    )
  ])
}

function onRadioClick(e) {
  if (this.checked) useTheme(this.value)
}

function updateForm(form) {
  var same = localStorage.themeId === activeTheme
  form.querySelector('.themes__id').value = activeTheme
  form.querySelector('.themes__reset').disabled = same
  form.querySelector('.themes__submit').disabled = same
  return form
}

function renderTheme(link) {
  return h('div.theme',
    h('input', {type: 'radio', name: 'theme',
      value: link.id, onclick: onRadioClick,
      checked: link.id === activeTheme
    }),
    link.id ? h('a', {href: '#'+link.id}, link.name) : link.name, ' ',
    link.feed ? h('a', {href: '#'+link.feed}, avatar_name(link.feed)) : ''
  )
}

function theme_view() {
  var themeInput
  var themesList = h('form.themes__list')

  pull(
    themes(),
    pull.unique('id'),
    pull.map(renderTheme),
    pull.drain(function (el) {
      themesList.appendChild(el)
    }, function (err) {
      if (err) console.error(err)
    })
  )

  return h('div.column.scroll-y', h('div',
    updateForm(h('form.themes__form', {onsubmit: onsubmit, onreset: onreset},
      themeInput = h('input.themes__id', {placeholder: 'theme id',
        value: link.href}), ' ',
      h('input.themes__reset', {type: 'reset'}), ' ',
      h('input.themes__submit', {type: 'submit', value: 'Save'}))),
      themesList
  ))

  function onsubmit(e) {
    e.preventDefault()
    useTheme(localStorage.themeId = themeInput.value)
  }

  function onreset(e) {
    e.preventDefault()
    useTheme(localStorage.themeId || '')
  }
}

exports.screen_view = function (path) {
  if(path === '/theme') return theme_view()
}
