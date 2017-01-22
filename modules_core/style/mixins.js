
const mixins = `
  $textPrimary {
    color: #222
  }

  $textSubtle {
    color: gray
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

