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
_textPrimary {
  color: #222
}

_textSubtle {
  color: gray
}

_backgroundPrimary {
  background-color: #50aadf
}

_avatarLarge {
  width: 56px
  height: 56px
}

_avatarSmall {
  width: 32px
  height: 32px
}
`

