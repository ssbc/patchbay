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

$colorPrimary {
  color: #fff
  background-color: #3dc8c3

  (a) {
    color: #5c6bc0
  }
}

$borderPrimary {
  border: 1px solid #50aadf
}

$backgroundPrimary {
  background-color: #fff
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
