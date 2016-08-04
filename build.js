var fs = require('fs')
var path = require('path')

fs.writeFileSync(
  path.join(__dirname, 'style.css.json'),
  JSON.stringify(fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8'))
)


fs.writeFileSync(path.join(__dirname, 'modules', '_index.js'),
  'module.exports = {\n'
  +
  fs.readdirSync(path.join(__dirname, 'modules'))
  .filter(function (file) {
    return file !== '_index.js' && /\.js$/.test(file)
  })
  .map(function (file) {
    return '  '+JSON.stringify(file) + ":  require('./"+file+"')"
  }).join(',\n')
  +
  '\n}'
)
