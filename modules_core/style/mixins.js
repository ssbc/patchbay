
const mixins = `
  _textPrimary {
    color: #222
  }

  _textSubtle {
    color: gray
  }

  _backgroundPrimary {
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

