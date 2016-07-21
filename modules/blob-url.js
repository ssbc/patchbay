var config = require('../config')

exports.blob_url = function (link) {
  if('string' == typeof link.link)
    link = link.link
  console.log(config(), link)
  return config().blobsUrl + '/'+link
}

