
const mixins = `
  $textPrimary {
    color: #222
  }

  $textSubtle {
    color: gray
  }

  $backgroundPrimary {
    background-color: #50aadf
  }
`

module.exports = {
  gives: {
    mcss: true
  },
  create: function (api) {
    return {
      mcss: () => mixins
    }
  }
}

