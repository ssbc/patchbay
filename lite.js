// this is for `npm run lite`

const Config = require('ssb-config/inject')
const Start = require('./ui.js')

const config = Config(process.env.ssb_appname || 'ssb')

Start(config)
