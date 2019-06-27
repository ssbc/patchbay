const nest = require('depnest')
const { h, Value, watch, computed } = require('mutant')

exports.gives = nest({
  'app.html.settings': true
})

exports.needs = nest({
  'app.html.settings': 'map',
  'settings.obs.get': 'first',
  'settings.sync.set': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.settings': locale
  })

  function locale () {
    const state = {
      locale: api.settings.obs.get('patchbay.localeCode'),
      nextLocale: Value(),
      processing: Value(false),
      success: Value(null)
    }

    if (window.spellCheckHandler.currentSpellcheckerLanguage) {
      state.nextLocale.set(getCurrentLocale())
    }

    watch(state.locale, code => {
      if (!window.spellCheckHandler) return console.error('spellchecker not installed')
      if (!code) return state.locale.set(getCurrentLocale())
      if (code === getCurrentLocale()) return

      state.processing.set(true)

      window.spellCheckHandler.switchLanguage(code)
        .then(() => {
          state.processing.set(false)
          const currentLocale = getCurrentLocale()

          if (currentLocale === code) {
            state.success.set(true)
          } else {
            state.success.set(false)
            state.nextLocale.set(currentLocale)
            state.locale.set(currentLocale)
          }
        })
        .catch(err => {
          state.processing.set(false)
          console.error(err)
        })
    })

    return {
      title: 'Language',
      body: h('Language', [
        h('p', 'This is only used for the spell checker currently. You have to use a valid language code (e.g. en-GB), but invalid guesses will be fixed!'),
        h('div', [
          h('input', {
            value: state.nextLocale,
            'ev-input': ev => {
              state.success.set(null)
              state.nextLocale.set(ev.target.value.trim())
            }
          }),
          computed([state.processing, state.success], (processing, success) => {
            if (processing) return h('i.fa.fa-spinner.fa-pulse')

            if (success) return h('i.fa.fa-check')

            return h('button',
              { 'ev-click': () => state.locale.set(state.nextLocale()) },
              'set'
            )
          })
        ])
      ])
    }
  }
}

function getCurrentLocale () {
  return window.spellCheckHandler.currentSpellcheckerLanguage
}
