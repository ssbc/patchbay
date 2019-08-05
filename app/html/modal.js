const nest = require('depnest')
const { h, Value } = require('mutant')

exports.gives = nest('app.html.modal')

exports.create = (api) => {
  return nest('app.html.modal', (content, { isOpen, onOpen, onClose, className = '' } = {}) => {
    if (typeof isOpen !== 'function') isOpen = Value(false)

    const openMe = () => {
      isOpen.set(true)
    }
    const closeMe = () => {
      isOpen.set(false)
      if (typeof onClose === 'function') onClose()
    }

    const modal = h('Modal -closed',
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
          // I think content must be in the DOM for any downstream mutant Observers to be updating
        ])
      ]
    )

    isOpen(state => {
      if (state === true) {
        modal.classList.remove('-closed')
        modal.classList.add('-open')
      } else {
        modal.classList.remove('-open')
        modal.classList.add('-closed')
        return
      }

      if (typeof onOpen === 'function') onOpen()
      focus()

      function focus () {
        if (!modal.isConnected) setTimeout(focus, 200)
        else {
          const target = modal.querySelector('input') || modal.querySelector('textarea')
          if (target) target.focus()
        }
      }
    })

    modal.open = openMe
    modal.close = closeMe

    return modal
  })
}
