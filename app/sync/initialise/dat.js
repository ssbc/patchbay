const nest = require('depnest')
const datSharedFiles = require('dat-shared-files/lib')

exports.gives = nest('app.sync.initialise')

exports.needs = nest({
  'router.sync.router': 'first',
  'app.html.tabs': 'first'
})

exports.create = function (api) {
  return nest('app.sync.initialise', datShare)

  function datShare () {
    datSharedFiles.shareFiles(links => {
      links.forEach(link => console.log('Sharing: ' + link))
    })
  }
}
