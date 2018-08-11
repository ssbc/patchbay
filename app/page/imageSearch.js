const nest = require('depnest')
const { h, Dict, Value, watch, throttle, computed, map, onceTrue } = require('mutant')

exports.gives = nest({
  'app.page.imageSearch': true,
  'app.html.menuItem': true
})

exports.needs = nest({
  'sbot.obs.connection': 'first',
  'blob.sync.url': 'first',
  'app.html.modal': 'first',
  'app.sync.goTo': 'first',
  'about.obs.name': 'first',
  'backlinks.obs.for': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.menuItem': menuItem,
    'app.page.imageSearch': searchPage
  })

  function menuItem () {
    return h('a', {
      style: { order: 0 },
      'ev-click': () => api.app.sync.goTo('/imageSearch')
    }, '/imageSearch')
  }

  function searchPage (location) {
    const query = Value('')
    const results = Dict({})

    watch(throttle(query, 300), q => {
      if (q && q.length < 3) return
      onceTrue(api.sbot.obs.connection, sbot => {
        sbot.meme.search(q, (err, data) => {
          if (err) return console.error(err)
          results.set(data)
        })
      })
    })

    const focusedBlob = Value()
    const modal = Modal({
      results,
      focusedBlob,
      blobUrl: api.blob.sync.url,
      name: api.about.obs.name,
      goTo: api.app.sync.goTo,
      createModal: api.app.html.modal,
      backlinks: api.backlinks.obs.for
    })

    const page = h('Page -imageSearch', [
      modal,
      h('section.settings', [
        h('input', {
          'placeholder': 'search image by name',
          'ev-input': ev => query.set(ev.target.value)
        })
      ]),
      h('section.results', computed([results, query], (results, query) => {
        if (!Object.keys(results).length && query.length >= 3) return h('p', '0 results')

        return Object.keys(results).map(blob => {
          return h('div', { 'ev-click': () => focusedBlob.set(blob) }, [
            h('img', { src: api.blob.sync.url(blob) })
          ])
        })
      }))
    ])

    page.title = '/imageSearch'

    return page
  }
}

function Modal ({ results, focusedBlob, blobUrl, name, goTo, createModal, backlinks }) {
  const onClick = (link) => () => {
    isOpen.set(false)
    goTo(link)
  }

  const isOpen = Value(false)
  focusedBlob(blob => {
    if (blob) isOpen.set(true)
  })
  const modalContent = computed([focusedBlob], (blob) => {
    if (!blob) return

    const entries = computed(backlinks(blob), msgs => {
      return msgs.reduce((soFar, msg) => {
        const entries = getMentions(msg)
          .filter(mention => mention.link === blob)
          // .filter(mention => mention.name)
          .map(mention => { return { name: mention.name, author: msg.value.author, msg: msg.key, ts: msg.value.timestamp } })
        return [...soFar, ...entries]
      }, [])
    })

    const imageName = Value('CHOOSE YOUR OWN NAME')

    return h('ImageSearchDetails', [
      h('img', { src: blobUrl(blob) }),
      h('div.md', [
        'Copy markdown: ',
        h('pre', ['![', imageName, '](', blob, ')'])
      ]),
      h('table', map(entries, entry => {
        return h('tr', { 'ev-mouseover': () => entry.name && imageName.set(entry.name) }, [
          h('td', entry.name),
          h('td.msg', h('a', { href: '#', 'ev-click': onClick(entry.msg) }, entry.msg.substring(0, 10) + '...')),
          h('td', h('a', { href: '#', 'ev-click': onClick(entry.author) }, ['@', name(entry.author)])),
          h('td', JSON.stringify(new Date(entry.ts)).substring(1, 11)) // I am a bad human D:
        ])
      })),
      h('button', {
        'ev-click': () => {
          focusedBlob.set()
          isOpen.set(false)
        }
      }, 'Close')
    ])
  })
  return createModal(modalContent, { isOpen })
}

function getMentions (msg) {
  if (!msg.value.content.mentions) return []
  else if (!Array.isArray(msg.value.content.mentions)) return [msg.value.content.mentions]
  else return msg.value.content.mentions
}
