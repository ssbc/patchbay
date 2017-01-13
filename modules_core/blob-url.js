var config = require('../config')

module.exports = {
  gives: 'blob_url',
  create: () => {
    return link => {
      if('string' == typeof link.link)
        link = link.link
      return config().blobsUrl + '/'+link
    }
  }
}

