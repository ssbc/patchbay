const test = require('tape')
const combine = require('depject')
const bulk = require('bulk-require')
const path = require('path')

process.env.ssb_appname = 'test'

console.log(path.join( __dirname, '../modules_core'))


console.log(`
/////////
// CURRENTLY TEST BROKEN
//
// It's bulk-require. I've tried using bulkify but it it does not seem to play well with brfs
/////////
`)

// list these sets from most specifc to most general
const module_sets = [
  { name: 'modules_core', modules: bulk(path.join(__dirname, '..'), ['modules_core/**/*.js']) },
  { name: 'modules_basic', modules: bulk(path.join(__dirname, '..'), ['modules_basic/**/*.js']) },
  { name: 'modules_extra', modules: bulk(path.join(__dirname, '..'), ['modules_extra/**/*.js']) }
]

module_sets.forEach((set, i, sets) => {
  const activeSets = sets.slice(0, i+1)
    // must reverse so loaded most general to most core
    .reverse()
    .map(set => set.modules)


  test(set.name + ' has no outside deps', t => {
    t.ok(combine.apply(activeSets))
    t.end()
  })
})

