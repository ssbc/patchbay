
const mixins = `
  $textPrimary {
    color: black
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

