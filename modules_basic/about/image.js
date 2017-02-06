'use strict'
var h = require('hyperscript')
var visualize = require('visualize-buffer')

var pull = require('pull-stream')

var self_id = require('../../keys').id

exports.needs = {
  sbot_query: 'first',
  blob_url: 'first'
}

exports.gives = {
  connection_status: true,  // TODO rename this
  about_image_src: true,
  about_image: true
}

var ready = false
var waiting = []

var last = 0

var cache = {}

exports.create = function (api) {
  var avatars  = {}

  //blah blah
  return {
    connection_status: function (err) {
      if (err) return
      pull(
        api.sbot_query({
          query: [{
            $filter: {
              timestamp: {$gt: last || 0 },
              value: { content: {
                type: "about",
                about: {$prefix: "@"},
                image: {link: {$prefix: "&"}}
            }}
          }},
          {
            $map: {
              id: ["value", "content", "about"],
              image: ["value", "content", "image", "link"],
              by: ["value", "author"],
              ts: 'timestamp'
          }}],
          live: true
        }),
        pull.drain(function (a) {
          if(a.sync) {
            ready = true
            while(waiting.length) waiting.shift()()
            return
          }
          last = a.ts
          //set image for avatar.
          //overwrite another avatar
          //you picked.
          if(
            //if there is no avatar
              (!avatars[a.id]) ||
            //if i chose this avatar
              (a.by == self_id) ||
            //they chose their own avatar,
            //and current avatar was not chosen by me
              (a.by === a.id && avatars[a.id].by != self_id)
          )
            avatars[a.id] = a

        })
      )
    },

    about_image_src: function (author) {
      return ready && avatars[author]
        ? api.blob_url(avatars[author].image)
        : genSrc(author)

      function genSrc (id) {
        if(cache[id]) return cache[id]
        var { src } = visualize(new Buffer(author.substring(1), 'base64'), 256)
        cache[id] = src
        return src
      }
    },

    about_image: function (author, classes) {
      classes = classes || ''
      if(classes && 'string' === typeof classes) classes = '.avatar--'+classes

      function gen (id) {
        if(cache[id]) return h('img', {src: cache[id]})
        var img = visualize(new Buffer(author.substring(1), 'base64'), 256)
        cache[id] = img.src
        return img
      }

      var img = ready && avatars[author] ? h('img', {src: api.blob_url(avatars[author].image)}) : gen(author)

      ;(classes || '').split('.').filter(Boolean).forEach(function (c) {
        img.classList.add(c)
      })

      if(!ready)
        waiting.push(function () {
          if(avatars[author]) img.src = api.blob_url(avatars[author].image)
        })

      return img
    }
  }
}
