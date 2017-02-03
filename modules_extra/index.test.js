const test = require('tape')
const combine = require('depject')

process.env.ssb_appname = 'test'

const core = require('../modules_core')
const basic = require('../modules_basic')
const extra = require('./')

test('modules_extra has no outside deps', t => {
  t.ok(combine(extra, basic, core))
  t.end()
})

