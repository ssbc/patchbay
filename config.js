
var URL = require('url')

module.exports = function () {
  var remote = 'undefined' === typeof localStorage
    ? null //'ws://localhost:8989~shs:' + require('./keys')
    : localStorage.remote


  //TODO: use _several_ remotes, so if one goes down,
  //      you can still communicate via another...
  //      also, if a blob does not load, use another pub...

  //if we are the light client, get our blobs from the same domain.
  var blobsUrl
  if(remote) {
    var r = URL.parse(remote.split('~')[0])
    //this will work for ws and wss.
    r.protocol = r.protocol.replace('ws', 'http')
    r.pathname = '/blobs/get'
    blobsUrl = URL.format(r)
  }
  else
    blobsUrl = 'http://localhost:8989/blobs/get'

  return {
    remote,
    blobsUrl
  }
}


