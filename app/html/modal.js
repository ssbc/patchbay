const nest = require('depnest')
const { h, when, Value } = require('mutant')

exports.gives = nest('app.html.modal')

exports.create = (api) => {
  return nest('app.html.modal', (content, { isOpen, onClose, className = '' } = {}) => {
    if (typeof isOpen !== 'function') isOpen = Value(false)

    const openMe = () => isOpen.set(true)
    const closeMe = () => {
      isOpen.set(false)
      if (typeof onClose === 'function') onClose()
    }

    const lb = h('Modal', { classList: [when(isOpen, '-open', '-close'), className], 'ev-click': closeMe },
      h('div.content', {'ev-click': (ev) => ev.stopPropagation()}, [
        content
      ]))

    lb.open = openMe
    lb.close = closeMe

    return lb
  })
}
