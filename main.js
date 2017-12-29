const combine = require('depject')
const entry = require('depject/entry')
const nest = require('depnest')

// polyfills
require('setimmediate')

const patchbay = { 
  patchbay: {
    about: {
      html: {
        avatar: require('./about/html/avatar'),
        edit: require('./about/html/edit'),
        link: require('./about/html/link'),
      },
    },
    app: {
      async: {
        catchLinkClick: require('./app/async/catch-link-click'),
      },
      html: {
        app: require('./app/html/app'),
        externalConfirm: require('./app/html/external-confirm'),
        filter: require('./app/html/filter'),
        menu: require('./app/html/menu'),
        scroller: require('./app/html/scroller'),
        searchBar: require('./app/html/search-bar'),
        tabs: require('./app/html/tabs'),
      },
      page: {
        blob: require('./app/page/blob'),
        channel: require('./app/page/channel'),
        errors: require('./app/page/errors'),
        notifications: require('./app/page/notifications'),
        private: require('./app/page/private'),
        profile: require('./app/page/profile'),
        public: require('./app/page/public'),
        search: require('./app/page/search'),
        thread: require('./app/page/thread'),
      },
      styles: {
        css: {
          fontAwesome: require('./app/styles/css/font-awesome'),
          global: require('./app/styles/css/global'),
        },
        mixins: require('./app/styles/mixins'),
      },
      sync: {
        catchKeyboardShortcut: require('./app/sync/catch-keyboard-shortcut'),
        goTo: require('./app/sync/goTo'),
        initialise: {
          settings: require('./app/sync/initialise/settings')
        },
      }
    },
    blob: {
      sync: { url: require('./blob/sync/url') },
    },
    contact: {
      html: { relationships: require('./contact/html/relationships') },
    },
    message: {
      html: {
        author: require('./message/html/author'),
        compose: require('./message/html/compose'),
        confirm: require('./message/html/confirm'),
        decorate: {
          dataRoot: require('./message/html/decorate/data-root'),
          dataText: require('./message/html/decorate/data-text'),
        },
        layout: {
          default: require('./message/html/layout/default'),
          mini: require('./message/html/layout/mini'),
        },
        like: require('./message/html/like'),
        meta: {
          likes: require('./message/html/meta/likes'),
          raw: require('./message/html/meta/raw'),
        },
        render: {
          about: require('./message/html/render/about'),
          contact: require('./message/html/render/contact'),
        },
      },
    },

    router: {
      sync: {
        routes: require('./router/sync/routes'),
      },
    },
    styles: {
      css: require('./styles/css'),
      mcss: require('./styles/mcss'),
    },
    config: require('./config'), // shouldn't be in here ?
    contextMenu: require('patch-context'),
    suggestions: require('patch-suggest'),
    settings: require('patch-settings'),
    drafts: require('patch-drafts'),
    inbox: require('patch-inbox'), // TODO - ideally this would be a standalone patch-* module
    history: require('patch-history'),
  }
}


// from more specialized to more general
const sockets = combine(
  //require('ssb-horcrux'),
  //require('patch-hub'),

  require('ssb-chess'),
  require('patchbay-gatherings'),
  require('patchbay-book'),
  // require('patch-network),
  patchbay,
  require('patchcore')
)

const api = entry(sockets, nest('app.html.app', 'first'))
const app = api.app.html.app

module.exports = patchbay

// for electro[n]
if (typeof window !== 'undefined') {
  document.body.appendChild(app())
}

