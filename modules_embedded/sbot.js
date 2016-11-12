var pull = require('pull-stream')
var ssbKeys = require('ssb-keys')
var ref = require('ssb-ref')
var Reconnect = require('pull-reconnect')
var path = require('path')
var config = require('ssb-config/inject')(process.env.ssb_appname)
config.keys = ssbKeys.loadOrCreateSync(path.join(config.path, 'secret'))

function Hash (onHash) {
  var buffers = []
  return pull.through(function (data) {
    buffers.push('string' === typeof data
      ? new Buffer(data, 'utf8')
      : data
    )
  }, function (err) {
    if(err && !onHash) throw err
    var b = buffers.length > 1 ? Buffer.concat(buffers) : buffers[0]
    var h = '&'+ssbKeys.hash(b)
    onHash && onHash(err, h)
  })
}
//uncomment this to use from browser...
//also depends on having ssb-ws installed.
//var createClient = require('ssb-lite')
var createClient = require('ssb-client')

var createConfig = require('ssb-config/inject')

var createFeed   = require('ssb-feed')
var keys = require('../keys')
var ssbKeys = require('ssb-keys')


var cache = CACHE = {}

var opts = createConfig()
var sbot = null
var connection_status = []

  var createSbot = require('scuttlebot')
    .use(require('scuttlebot/plugins/gossip'))
    .use(require('scuttlebot/plugins/friends'))
    .use(require('scuttlebot/plugins/replicate'))
    .use(require('ssb-blobs'))
    .use(require('scuttlebot/plugins/invite'))
    .use(require('scuttlebot/plugins/block'))
    .use(require('scuttlebot/plugins/local'))
    .use(require('ssb-ws'))
    .use(require('ssb-query'))
    .use(require('ssb-links'))
  var sbot = createSbot(config)


var rec = Reconnect(function (isConn) {

  function notify (value) {
    console.log('connection_status', value, connection_status)
    isConn(value); connection_status.forEach(function (fn) { fn(value) })
  }

  return setTimeout(notify)
})

var internal = {
  getLatest: sbot.getLatest,
  add: sbot.add,
}

var feed = createFeed(internal, keys, {remote: true})

module.exports = {
  connection_status: connection_status,
  sbot_blobs_add: function (cb) {
    return pull(
      Hash(function (err, id) {
        if(err) return cb(err)
        //completely UGLY hack to tell when the blob has been sucessfully written...
        var start = Date.now(), n = 5
        ;(function next () {
          setTimeout(function () {
            sbot.blobs.has(id, function (err, has) {
              if(has) return cb(null, id)
              if(n--) next()
              else cb(new Error('write failed'))
            })
          }, Date.now() - start)
        })()
      }),
      sbot.blobs.add()
    )
  },
  sbot_links: sbot.links,
  sbot_links2: sbot.links2.read,
  sbot_query: sbot.query.read,
  sbot_log: function (opts) {
    return pull(
      sbot.createLogStream(opts),
      pull.through(function (e) {
        CACHE[e.key] = CACHE[e.key] || e.value
      })
    )
  },
  sbot_user_feed: sbot.createUserStream,
  sbot_get: function (key, cb) {
    if(CACHE[key]) cb(null, CACHE[key])
    else sbot.get(key, function (err, value) {
      if(err) return cb(err)
      cb(null, CACHE[key] = value)
    })
  },
  sbot_gossip_peers: sbot.gossip.peers,
  sbot_gossip_connect: sbot.gossip.connect,
  sbot_progress: sbot.gossip.change,
  sbot_publish: function (content, cb) {
    if(content.recps)
      content = ssbKeys.box(content, content.recps.map(function (e) {
        return ref.isFeed(e) ? e : e.link
      }))
    else if(content.mentions)
      content.mentions.forEach(function (mention) {
        if(ref.isBlob(mention.link)) {
          sbot.blobs.push(mention.link, function (err) {
            if(err) console.error(err)
          })
        }
      })

    feed.add(content, function (err, msg) {
      if(err) console.error(err)
      else if(!cb) console.log(msg)
      cb && cb(err, msg)
    })
  },
  sbot_whoami: sbot.whoami,
}



