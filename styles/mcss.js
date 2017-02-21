const { basename } = require('path')
const readDirectory = require('read-directory')
const { each } = require('libnested')
const nest = require('depnest')

const contents = readDirectory.sync(__dirname, {
  extensions: false,
  filter: '**/*.mcss'
})

exports.gives = nest('styles.mcss')
exports.create = () => (sofar = {}) => {
  each(contents, (content, [filename]) => {
    const name = basename(filename)
    sofar[name] = content
  })
  return sofar
}
