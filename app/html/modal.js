const nest = require('depnest')
const { h, computed, Value } = require('mutant')

exports.gives = nest('app.html.modal')

exports.create = (api) => {
  return nest('app.html.modal', (content, { isOpen, onClose, className = '' } = {}) => {
    if (typeof isOpen !== 'function') isOpen = Value(false)

    const openMe = () => {
      isOpen.set(true)
    }
    const closeMe = () => {
      isOpen.set(false)
      if (typeof onClose === 'function') onClose()
    }

    const lb = computed(isOpen, _isOpen => {
      if (!_isOpen) return h('Modal -close')

      return h('Modal -open',
        {
          className,
          'ev-click': closeMe,
          'ev-keydown': ev => {
            if (ev.keyCode === 27) closeMe() // Escape
          }
        },
        [
          h('div.content', { 'ev-click': (ev) => ev.stopPropagation() }, [
            content
          ])
        ]
      )
    })

    isOpen(state => {
      if (state !== true) return

      focus()
      function focus () {
        if (!lb.isConnected) setTimeout(focus, 200)
        else {
          const target = lb.querySelector('input') || lb.querySelector('textarea')
          if (target) target.focus()
        }
      }
    })

    lb.open = openMe
    lb.close = closeMe

    return lb
  })
}
