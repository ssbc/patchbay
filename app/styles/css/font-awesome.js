const nest = require('depnest')
const fs = require('fs')
const { join } = require('path')
const { assign } = Object

// const css = fs.readFileSync(join(__dirname, '../../../node_modules/font-awesome/css/font-awesome.min.css'), 'utf8')
const css = fs.readFileSync(join(__dirname, '../../../node_modules/font-awesome/css/font-awesome.css'), 'utf8')
  .replace(/\.{2}/g, '../font-awesome')

// TODO: for patchlite, may have to convert font urls into url(data:base64: ....) format

exports.gives = nest('styles.css')

exports.create = function (api) {
  return nest('styles.css', (sofar = {}) => {
    return assign(sofar, { fontAwesome: css })
  })
}


