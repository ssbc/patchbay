var h = require('hyperscript')

exports.gives = {
  message: { meta: true }
}

exports.create = function (api) {
  return {
    message: { meta }
  }

  function meta (msg) {
    var tmp = h('div')
    var el
    var pre
    const symbol = '\u2699' // gear ⚙
    var clicked = false

    return h('a', {
      title: 'View raw data',
      style: {
        order: 99,
        color: '#a8a8a8',
        'font-size': '1rem',
        cursor: 'pointer',
      },
      onclick: function () {
        clicked = !clicked

        // HACK (mw) yo we need a better way to replace the content
        var msgEl = this.parentNode.parentNode
        var msgContentEl = msgEl.querySelector('.\\.raw-content')
        if (clicked) {
          // move away the content
          while (el = msgContentEl.firstChild)
            tmp.appendChild(el)
          // show the raw stuff
          if (!pre) pre = h('pre', buildRawMsg(msg) )
          msgContentEl.appendChild(pre)
        } else {
          // hide the raw stuff
          msgContentEl.removeChild(pre)
          // put back the content
          while (el = tmp.firstChild)
            msgContentEl.appendChild(el)
        }
      }
    }, symbol)
  }
}


function buildRawMsg (msg) {
  return colorKeys(linkify(
    JSON.stringify({
      key: msg.key,
      value: msg.value
    }, 0, 2)
  ))
}

function colorKeys (chunks) {
  var newArray = []
  chunks.forEach(chunk => {
    if (typeof chunk !== 'string') return newArray.push(chunk)

    var arr = chunk.split(/("[^"]+":)/)
    for (var i = 1; i < arr.length; i += 2) {
      arr[i] = h('span', arr[i])
    }
    newArray = [...newArray, ...arr]
  })

  return newArray
}

function linkify (text) {
  // from ssb-ref
  var refRegex = /((?:@|%|&)[A-Za-z0-9\/+]{43}=\.[\w\d]+)/g

  var arr = text.split(refRegex)
  for (var i = 1; i < arr.length; i += 2) {
    arr[i] = h('a', {href: '#' + arr[i]}, arr[i])
  }
  return arr
}
