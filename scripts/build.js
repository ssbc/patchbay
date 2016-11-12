var fs = require('fs')
var path = require('path')

console.log(
  'module.exports = {\n'
  +
  fs.readdirSync(path.join(__dirname, process.argv[2]))
//  .filter(function (file) {
//    return file !== '_index.js' && /\.js$/.test(file)
//  })
  .map(function (file) {
    return '  '+JSON.stringify(file) + ":  require('./"+file+"')"
  }).join(',\n')
  +
  '\n}'
)


