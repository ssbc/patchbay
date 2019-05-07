const nest = require('depnest')
const electron = require('electron')

exports.gives = nest('app.sync.initialise')

exports.needs = nest({
  'settings.sync.get': 'first',
  'settings.sync.set': 'first'
})

exports.create = function (api) {
  return nest('app.sync.initialise', errorCatcher)

  function errorCatcher () {
    /// /// TODO - extract this to keep patch-lite isolated from electron
    const { getCurrentWebContents, getCurrentWindow } = electron.remote
    window.addEventListener('resize', () => {
      var wc = getCurrentWebContents()
      wc && wc.getZoomFactor((zf) => {
        api.settings.sync.set({
          electron: {
            zoomFactor: zf,
            windowBounds: getCurrentWindow().getBounds()
          }
        })
      })
    })

    var zoomFactor = api.settings.sync.get('electron.zoomFactor')
    if (zoomFactor) { getCurrentWebContents().setZoomFactor(zoomFactor) }

    var bounds = api.settings.sync.get('electron.windowBounds')
    if (bounds) { getCurrentWindow().setBounds(bounds) }
    /// ///
  }
}
