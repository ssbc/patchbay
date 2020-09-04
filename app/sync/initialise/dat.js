const nest = require('depnest')
// const datSharedFiles = require('dat-shared-files')

exports.gives = nest('app.sync.initialise')

exports.create = function (api) {
  return nest('app.sync.initialise', datShare)

  function datShare () {
    // TODO upgrade sodium-native inside dat-shared-files
    // if (process.env.DAT === 'false') return

    // datSharedFiles.shareAll((err, links) => {
    //   if (err) {
    //     console.error(err)

    //     return
    //   }

    //   links.forEach(link => console.log('Sharing: ' + link))
    // })
  }
}
