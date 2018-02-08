const nest = require('depnest')

exports.gives = nest('router.async.router')

exports.needs = nest({
  'router.async.normalise': 'first',
  'router.sync.routes': 'reduce'
})

exports.create = (api) => {
  var router = null

  return nest('router.async.router', (location, cb) => {
    if (!router) {
      router = Router(api.router.sync.routes())
    }

    api.router.async.normalise(location, (err, normLocation) => {
      if (err) return cb(err)

      router(normLocation, cb)
    })

    // stop depject 'first' after this method
    return true
  })
}

function Router (routes) {
  return (location, cb) => {
    const route = routes.find(([validator]) => validator(location))
    // signature of a route is [ routeValidator, routeFunction ]

    if (route) cb(null, route[1](location))
  }
}
