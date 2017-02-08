var config = require('../../config')

module.exports = {
  gives: {
    helpers: { blob_url: true }
  },
  create: () => {
    return {
      helpers: { 
        blob_url
      }
    }

    function blob_url (link) {
      if('string' == typeof link.link)
        link = link.link
      return config().blobsUrl + '/'+link
    }
  }
}

