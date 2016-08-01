var fs = require('fs')

fs.readdirSync(__dirname).forEach(function (e) {
  if(e !== '_index.js')
    exports[e] = require('./'+e)
})



