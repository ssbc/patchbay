var markdown = require('ssb-markdown');
var h = require('hyperscript');
var u = require('../../util');
var ref = require('ssb-ref');

//render a message

exports.gives = {
  message: { content: true }
}

exports.create = function () {
  return {
    message: { content }
  }

  function content (msg, sbot) {
      if (msg.value.content.type !== 'music-release') return

      var v = msg.value.content;
      return h('div',
          // h('img', { "src" : "http://localhost:7777/" + encodeURIComponent(v.cover) }),
          h('h1', v.Title),
          h("p", v.Description),
          h("dl",

                   h("dt", "Creator"),
                   h("dd", v.Creator),

                   h("dt", "Identifier"),
                   h("dd", v.Identifier),

                   h("dt", "Published"),
                   h("dd", v.Publicdate),

                   h("dt", "Runtime"),
                   h("dd", v.Runtime),

                   h("dt", "Source"),
                   h("dd", v.Source),

                   h("dt", "License"),
                   h("dd", h('a', { href : v.Licenseurl }, "Link"))))
  }
}
