
const mixins = `
  $text-primary {
    color: black
  }

  $text-subtle {
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

