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
  color: #222
}

$textSubtle {
  color: gray
}

$backgroundPrimary {
  background-color: #50aadf
}

$avatarLarge {
  width: 56px
  height: 56px
}

$avatarSmall {
  width: 32px
  height: 32px
}
`
