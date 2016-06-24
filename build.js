
console.log(
  'module.exports = [\n',
  require('fs').readdirSync(require('path').join(__dirname, 'modules'))
  .filter(function (file) {
    return file !== 'index.js'
  })
  .map(function (file) {
    return "  require('./"+file+"')"
  }).join(',\n'),
  '\n]'
)

