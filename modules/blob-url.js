var config = require('../config')

exports.blob_url = function (link) {
  if('string' == typeof link.link)
    link = link.link
  return config().blobsUrl + '/'+link
}


