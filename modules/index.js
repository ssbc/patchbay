var fs = require('fs')

fs.readdirSync(__dirname).forEach(function (e) {
  if(e !== '_index.js' && /\js$/.test(e))
    exports[e] = require('./'+e)
})



