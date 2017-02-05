const bulk = require('bulk-require') 
const path = require('path')

// polyfills
require('setimmediate')

require('depject')(
  // from more specialized to more general
  load('modules_extra'),
  load('modules_basic'),
  load('modules_core')
).app[0]()


function load (moduleSetName) {
  const set = bulk(path.join(__dirname, moduleSetName), ['**/*.js'])
  // console.log(moduleSetName, set)
  return set
}

