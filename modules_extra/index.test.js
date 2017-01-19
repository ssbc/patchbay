const test = require('tape')
const jsdom = require('jsdom')
const combine = require('depject')

var window = {}

const core = require('../modules_core')
const basic = require('../modules_basic')
const extra = require('./')

// jsdom.env('<body></body>', (err, window) => {

  test('modules_extra has no outside deps', t => {
    t.ok(combine(extra, basic, core))
    t.end()
    // window.close()
  })
// })


