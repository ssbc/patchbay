var fs = require('fs')
var path = require('path')

console.log(
  'module.exports = {\n'
  +
  fs.readdirSync(path.join(process.cwd(), process.argv[2]))
  .filter(function (file) {
    return file !== 'index.js' && /\.js$/.test(file)
  })
  .map(function (file) {
    return '  '+JSON.stringify(file) + ":  require('./"+file+"')"
  }).join(',\n')
  +
  '\n}'
)


