const nest = require('depnest')
const fs = require('fs')
const { join, dirname } = require('path')
const { assign } = Object
const styleResolve = require('style-resolve')

const fontCssPath = styleResolve.sync('font-awesome')
const css = fs.readFileSync(fontCssPath, 'utf8')
  .replace(/\.{2}/g, (match) => join(dirname(fontCssPath), match))

// TODO: for patchlite, may have to convert font urls into url(data:base64: ....) format

exports.gives = nest('styles.css')

exports.create = function (api) {
  return nest('styles.css', (sofar = {}) => {
    return assign(sofar, { fontAwesome: css })
  })
}

