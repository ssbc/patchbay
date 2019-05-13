const nest = require('depnest')
const datSharedFiles = require('dat-shared-files/lib')

exports.gives = nest('app.sync.initialise')

exports.create = function (api) {
  return nest('app.sync.initialise', datShare)

  function datShare () {
    if (process.env.DAT === 'false') return

    datSharedFiles.shareFiles(links => {
      links.forEach(link => console.log('Sharing: ' + link))
    })
  }
}
