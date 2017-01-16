var markdown = require('ssb-markdown');
var h = require('hyperscript');
var u = require('../util');
var ref = require('ssb-ref');

//render a message

exports.needs = { blob_url: 'first' }
exports.gives = 'message_content'

exports.create = function (api) {
  return function(msg, sbot) {
    if (msg.value.content.type !== 'meta-image')
        return;

    var v = msg.value.content;
    return h('div',
        // h('h2', "(" + v.Track + ") " + v.Title),
        h('img', { "src" : api.blob_url(v.link) }))

    // h('dl',
    //          Object.keys(v).map(function(k) {
    //              return [
    //                  h("dt", k),
    //                  h("dd", v[k]),
    //              ]
    //          })))

    // "Album": "the fall of",
    //     "Crc32": "038becab",
    //     "Creator": "bleupulp",
    //     "Format": "VBR MP3",
    //     "Height": "0",
    //     "Length": "375.23",
    //     "Md5": "2c517c8e813da5f940c8c7e77d4b7f3f",
    //     "Mtime": "1399498698",
    //     "Name": "2_bleupulp_-_clouds.mp3",
    //     "Sha1": "9f6a96a3d5571ed1ec2a7da38ffebdcd5f181482",
    //     "Size": "15009000",

    //     "Title": "clouds",
    //     "Track": "2",
    //     "Width": "0",

  }
}
