const test = require('tape')
const combine = require('depject')

const core = require('../modules_core')
const basic = require('./')

test('modules_basic has no outside deps', t => {
  t.ok(combine(basic, core))
  t.end()
})

