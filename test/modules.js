const test = require('tape')
const combine = require('depject')
const bulk = require('bulk-require')
const path = require('path')

process.env.ssb_appname = 'test'

// list these sets from most specifc to most general
const module_sets = [
  { name: 'modules_core', modules: require('../modules_core') },
  { name: 'modules_basic', modules: require('../modules_basic') },
  { name: 'modules_extra', modules: require('../modules_extra') }
]

module_sets.forEach((set, i, sets) => {
  const activeSets = sets.slice(0, i+1)
    // must reverse so loaded most general to most core
    .reverse()
    .map(set => set.modules)


  test(set.name + ' has no outside deps', t => {
    t.ok(combine(...activeSets))
    t.end()
  })
})

