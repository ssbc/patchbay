const nest = require('depnest')
const { assign } = Object

// this is either:
// - wrong domain
// - wrong gives
//
exports.gives = nest('styles.mixins')

exports.create = function (api) {
  return nest('styles.mixins', (sofar = {}) => {
    return assign(sofar, { mainMixins })
  })
}

const mainMixins = `
$textPrimary {
  color: var(--page-color)
}

$textSubtle {
  color: var(--secondary)
}

$colorPrimary {
  color: var(--background)
  background-color: var(--cyan)

  (a) {
    color: var(--violet)
  }
}

$borderPrimary {
  border: 1px solid var(--cyan)
}

$backgroundPrimary {
  background-color: var(--background)
}

$avatarLarge {
  width: 56px
  height: 56px
}

$avatarSmall {
  width: 32px
  height: 32px
}

$threadWidth {
  min-width: 780px
  max-width: 840px
}
`
