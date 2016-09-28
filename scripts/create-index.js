var fs = require('fs')
var path = require('path')

fs.writeFileSync(
  path.join(__dirname, '..', 'style.css.json'),
  JSON.stringify(fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8'))
)

