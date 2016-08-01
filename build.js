
console.log(
  'module.exports = {\n'
  +
  require('fs').readdirSync(require('path').join(__dirname, 'modules'))
  .filter(function (file) {
    return file !== '_index.js' && /\.js$/.test(file)
  })
  .map(function (file) {
    return '  '+JSON.stringify(file) + ":  require('./"+file+"')"
  }).join(',\n')
  +
  '\n}'
)

