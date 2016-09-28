
//this is just an UGLY HACK, because depject does not
//support recursion...

//used by tabs and split views

var sv = require('../plugs').first(exports.screen_view = [])
exports._screen_view = function (value) {
  return sv(value)
}
