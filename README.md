# Patchbay

Patchbay is a scuttlebutt client designed to be easy to modify and extend.
It uses the same database as [Patchwork](https://github.com/ssbc/patchwork) and [Patchfoo](https://github.com/ssbc/patchfoo), so you can easily take it for a spin with your existing identity.

![](./screenshot.png)

Patchbay was created by Dominic Tarr towards the end of the life of Patchwork v1.
It was born our out of the observation that maintaining a large client apps can be really hard work.
Patchbay was designed to sidestep this by using some technology ([`depject`](https://github.com/dominictarr/depject)) to make parts easier to swap and extend.

Patchbay now shares a common core library ([`patchcore`](https://github.com/ssbc/patchcore)) with Patchwork, and connects this in using the `depject`
This is another experiment in sharing useful code and maintenance.

Current features boasted:
- gatherings - a booking system
- chess - p2p chess games and chat
- bookblub - a book review interface
- blogs - can read blogposts created in [Ticktack](https://github.com/ticktackim/ticktack-workplan)

## Install

Download easy installer for Mac / Windows / Linux here : https://github.com/ssbc/patchbay/releases

If you'd like to hack on Patchbay, check out the Developer Install below.

## Keyboard shortcuts

[See here](./app/page/SHORTCUTS.md) or in patchbay for to the page `/shortcuts`
---

## Developer Install

Libsodium has some build dependencies. On ubuntu systems the following might help:

```sh
sudo apt-get install m4 libtool eclipse-cdt-autotools
```

You also might need these for the spellchecker:
```sh
sudo apt-get install libxext-dev libxtst-dev libxkbfile-dev
```

On MacOS you may need the following packages installed (in this example, via [Homebrew](https://brew.sh/)):
```sh
brew install libtool automake autoconf
```

### Embedded sever (recommended)

This runs an embedded sbot with all the right plugins already installed.

```sh
git clone https://github.com/ssbc/patchbay
cd patchbay
npm install
```

Patchbay doesn't give you a way to join pubs yet, so this is good if you've already done that with another client (like Patchwork).


### External server

This method runs the ssb-server as a standalone command-line driven server.
The danger in this is that you don't install the right plugin versions, and the server won't necessarily be started with the right config
 (unless you add it to ~/.ssb/config etc).

For this reason I wouldn't currently recommend this approach.
Note that core devs aren't often running things this way, so if this is broken we wouldn't know, and might not be keen to fix it right now.

Install a standalone ssb-server (your gossip server)
```sh
npm install ssb-server@latest -g
```

```sh
sbot server

# then in another tab (these must be separate commands)
sbot plugins.install ssb-about
sbot plugins.install ssb-backlinks
sbot plugins.install ssb-unread
sbot plugins.install ssb-suggest
sbot plugins.install ssb-search # for search
sbot plugins.install ssb-chess-db # for chess
sbot plugins.install ssb-private # for private messages
sbot plugins.install ssb-meme # for image search

# restart sbot server (go back to previous tab and kill it)
```

Restart your sbot, then (optionally) use an invite code. This will give you your first friend, from which point you can find others:
```sh
sbot invite.accept LONG_INVITE_CODE_MAYBE_IN_QUOTES
```

Install Patchbay
```sh
git clone https://github.com/ssbc/patchbay
cd patchbay
npm install
```

## Running the desktop app

Easy mode (embedded sbot):
```sh
# from the patchbay repo folder
npm start
```

Harder mode:
```sh
ssb-server start

# from the patchbay repo folder
npm run lite
```

## Development

### Key depject modules in Patchbay

Here's a quick high level overview of the depject modules you're going to want to know about:

#### `app.html.app`

The top level module which starts the front end js.

#### `app.sync.initialise`

A collection of function which are called on app start.
Does things like load css into the app, set up custom listeners, set default settings

#### `app.sync.goTo(location)`

The function you call when you want to open a new location.
`location` can be a string (like a message or blob id) or an object.

Note - some locations are _normalised_ before being passed onto the router.
Check out `router.async.normalise` for explicit detail.

#### `router.sync.router`

This is the module where you can add routes to the app.
This is ultimately reduced along with all other `router.sync.router` modules into the final router.

#### `app.html.settings`

Giving modules here will add settings sections to the settings page (`app.page.settings`).


### Requiring the core of patchbay

If you don't want the default modules, you can grab the main part of patchbay and pick and choose modules like this:

```js
const patchcore = require('patchcore')
const patchbay = require('patchbay/main')
const combine = require('depject')
const entry = require('depject/entry')
const nest = require('depnest')

const sockets = combine(
  require('patchbay-dark-crystal'), // the module(s) you want
  patchbay,
  patchcore // required
)

const api = entry(sockets, nest('app.html.app', 'first'))
document.body.appendChild(api.app.html.app())
```

You'll need to be running your own sbot and launch this with electro / electron. See `index.js` to see that

### How to add a new page

e.g. to add a 'cats' page to the app:

- Add a file `app/page/cats.js` which gives `app.page.cats`
- Tell the router to send people browsing to location `{page: 'cats'}` to send them to this page
  - route will look like `[location => location.page === 'cats', api.app.page.cats]`
  - Note the normaliser will automaticall turn location `/cats` to `{page: 'cats'}`
- Add a link somewhere which will trigger that route:
  - e.g. activate`api.app.sync.goTo('/cats')` onclick
  - e.g. add a link `<a href='/cats'>Cats!</a>` (which will be clicked up by listeners)



## Contributors

### Code Contributors

This project exists thanks to all the people who contribute. [[Contribute](CONTRIBUTING.md)].
<a href="https://github.com/ssbc/patchbay/graphs/contributors"><img src="https://opencollective.com/patchbay/contributors.svg?width=890&button=false" /></a>

### Financial Contributors

Become a financial contributor and help us sustain our community. [[Contribute](https://opencollective.com/patchbay/contribute)]

#### Individuals

<a href="https://opencollective.com/patchbay"><img src="https://opencollective.com/patchbay/individuals.svg?width=890"></a>

#### Organizations

Support this project with your organization. Your logo will show up here with a link to your website. [[Contribute](https://opencollective.com/patchbay/contribute)]

<a href="https://opencollective.com/patchbay/organization/0/website"><img src="https://opencollective.com/patchbay/organization/0/avatar.svg"></a>
<a href="https://opencollective.com/patchbay/organization/1/website"><img src="https://opencollective.com/patchbay/organization/1/avatar.svg"></a>
<a href="https://opencollective.com/patchbay/organization/2/website"><img src="https://opencollective.com/patchbay/organization/2/avatar.svg"></a>
<a href="https://opencollective.com/patchbay/organization/3/website"><img src="https://opencollective.com/patchbay/organization/3/avatar.svg"></a>
<a href="https://opencollective.com/patchbay/organization/4/website"><img src="https://opencollective.com/patchbay/organization/4/avatar.svg"></a>
<a href="https://opencollective.com/patchbay/organization/5/website"><img src="https://opencollective.com/patchbay/organization/5/avatar.svg"></a>
<a href="https://opencollective.com/patchbay/organization/6/website"><img src="https://opencollective.com/patchbay/organization/6/avatar.svg"></a>
<a href="https://opencollective.com/patchbay/organization/7/website"><img src="https://opencollective.com/patchbay/organization/7/avatar.svg"></a>
<a href="https://opencollective.com/patchbay/organization/8/website"><img src="https://opencollective.com/patchbay/organization/8/avatar.svg"></a>
<a href="https://opencollective.com/patchbay/organization/9/website"><img src="https://opencollective.com/patchbay/organization/9/avatar.svg"></a>

## License

AGPL-3.0
