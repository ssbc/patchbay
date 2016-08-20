var h = require('hyperscript')
var pull = require('pull-stream')
var plugs = require('../plugs')
var cat = require('pull-cat')

var sbot_links2 = plugs.first(exports.sbot_links2 = [])
var avatar_name = plugs.first(exports.avatar_name = [])
var blob_url = require('../plugs').first(exports.blob_url = [])

var defaultTheme = {
  id: '&JFa42U6HtPm9k+s+AmpDIAoTJJI/PzoRC/J/WCfduDY=.sha256',
  name: 'patchbay-minimal.css'
}

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

function useSavedTheme() {
  useTheme(localStorage.themeId || defaultTheme.id)
}

setImmediate(useSavedTheme)

function themes() {
  return cat([
    pull.values([
      {
        id: '',
        name: 'none',
        feed: ''
      },
      defaultTheme,
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
  var themesByKey = {}

  pull(
    themes(),
    pull.unique('id'),
    pull.drain(function (theme) {
      // replace old versions of themes in the list
      var key = theme.feed + theme.name
      var oldTheme = themesByKey[key]
      theme.el = renderTheme(theme)
      themesByKey[key] = theme
      if (!oldTheme) {
        themesList.appendChild(theme.el)
      } else if (oldTheme.id === localStorage.themeId
              || oldTheme.id === activeTheme) {
        // show old version because the user is still using it
        oldTheme.el.appendChild(document.createTextNode(' (old)'))
        themesList.appendChild(theme.el)
      } else {
        themesList.replaceChild(theme.el, oldTheme.el)
      }
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
    useSavedTheme()
  }
}

exports.menu_items = function () {
  return h('a', {href:'#/theme'}, '/theme')
}

exports.screen_view = function (path) {
  if(path === '/theme') return theme_view()
}
