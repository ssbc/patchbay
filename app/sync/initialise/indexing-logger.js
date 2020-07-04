const nest = require('depnest')

exports.gives = nest('app.sync.initialise')

exports.needs = nest({
  'sbot.async.run': 'reduce'
})

const PERIOD = 3000
exports.create = function (api) {
  return nest('app.sync.initialise', () => {
    setInterval(() => api.sbot.async.run(indexingLog), PERIOD)
  })
}

var previouslySync = true
function indexingLog (server) {
  server.status((err, data) => {
    if (err) {
      console.error(err)
      return
    }

    if (data.sync.sync) {
      if (!previouslySync) {
        console.log('Indexing : DONE')
        previouslySync = true
      }
      return
    }

    previouslySync = false

    const indexes = data.sync.plugins
    const total = data.sync.since

    const output = Object.entries(indexes)
      .map(([name, progress]) => {
        const p = progress / total
        return `${leftpad(Math.floor(p * 100))}% ${progressBar(p)} : ${name}`
      })

    console.log(output.join('\n') + '\n\n')
  })
}

function leftpad (str, width = 4) {
  while (str.length !== width) str = ' ' + str
  return str
}

function progressBar (proportion, width = 40) {
  const fill = Math.floor(proportion * width)
  var out = ''
  for (var i = 0; i < width; i++) {
    out += (i < fill) ? '■' : '□'
  }

  return out
}
