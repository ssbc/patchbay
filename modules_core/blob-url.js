var config = require('../config')

module.exports = {
  gives: 'blob_url',
  create: function () {
    return function (link) {
      if('string' == typeof link.link)
        link = link.link
      return config().blobsUrl + '/'+link
    }
  }
}

