const nest = require('depnest')
const { onceTrue } = require('mutant')

exports.gives = nest('sbot.async.run')

exports.needs = nest({
  'sbot.obs.connection': 'first'
})

exports.create = (api) => {
  return nest({
    'sbot.async.run': function run (fn) {
      onceTrue(api.sbot.obs.connection, fn)
    }
  })
}
