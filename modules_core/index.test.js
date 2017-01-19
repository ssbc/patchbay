const test = require('tape')
const combine = require('depject')

const core = require('./')

test('modules_core has no outside deps', t => {
  t.ok(combine(core))
  t.end()
})

