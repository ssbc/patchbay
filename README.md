# Patchbay

Patchbay is a scuttlebutt client designed to be easy to modify and extend.
It uses the same database as Patchwork and Patchfoo, so you can easily take it for a spin with your existing identity.

![](./screenshot.png)

Patchbay was created by Dominic Tarr towards the end of the life of Patchwork v1.
It was born our out of the observation that maintaining a large client apps can be really hard work.
Patchbay was designed to sidestep this by using some technology ([`depject`](https://github.com/dominictarr/depject)) to make parts easier to swap and extend.

Patchbay now shares a common core library ([`patchcore`](https://github.com/ssbc/patchcore)) with Patchwork, and connects this in using the `depject`
This is another experiment in sharing useful code and mainmtenance.

Current features boasted:
- gatherings - a booking system
- chess - p2p chess games and chat
- bookblub - a book review interface
- blogs - can read blogposts created in Ticktack

## Install

Download easy installer for Mac / Windows / Linux here : https://github.com/ssbc/patchbay/releases

If you'd like to hack on Patchbay, check out the Developer Install below.

## Keyboard shortcuts

`CmdOrCtrl` is the `command` key on Apple keyboards or the `ctrl` key on PC keyboards.

### Tabs and window

- `h` / `CmdOrCtrl+Shift+]` : tabs left
- `j` / `CmdOrCtrl+Shift+[`: tabs right
- `x` / `CmdOrCtrl+w` : close tab
- `CmdOrCtrl+Shift+w` will close the current window

### Message feeds

`j` : next message (down)
`k` : previous message
`o` : open message thread (and scroll to position of this message in that thread)
` ` ` : toggle raw message view for currently selected message (` ` ` = backtick, lives on the same key as `~`)

composing : cttrl + enter = post

### Nav bar thing

`@` : start a person query
`#` : start a channel query
`?` : start a search query
`/` : start a navigation  (e.g. /public)  - need to re-instate suggestions for this

you can also paste a message id (starts with `%`) in here to navigate to it. Same with blobs (`&`)

---

## Developer Install

Libsodium has some build dependencies. On ubuntu systems the following might help:

```sh
sudo apt-get install m4 libtool eclipse-cdt-autotools
```

On MacOS you may need the following packages installed (in this example, via [Homebrew](https://brew.sh/)):
```sh
brew install libtool automake autoconf
```

### Easy Install

This runs an embedded sbot with all the right plugins already installed.

```sh
git clone https://github.com/ssbc/patchbay.git
cd patchbay
npm install
npm run rebuild
```

Patchbay doesn't give you a way to join pubs yet, so this is good if you've already done that with another client (like Patchwork).


### Harder Install (full dev setup)

Install a standalone scuttlebot (your gossip server)
```sh
npm install scuttlebot@latest -g
```

```sh
sbot server

# then in another tab (these must be separate commands)
sbot plugins.install ssb-about
sbot plugins.install ssb-backlinks
sbot plugins.install ssb-unread
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
git clone https://github.com/ssbc/patchbay.git
cd patchbay
npm install
npm run rebuild
```

## Running the desktop app

Easy mode (embedded sbot):
```sh
# from the patchbay repo folder
npm start
```

Harder mode:
```sh
sbot server

# from the patchbay repo folder
npm run dev
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


### How to add a new page

e.g. to add a 'cats' page to the app:

- Add a file `app/page/cats.js` which gives `app.page.cats`
- Tell the router to send people browsing to location `{page: 'cats'}` to send them to this page
  - route will look like `[location => location.page === 'cats', api.app.page.cats]`
  - Note the normaliser will automaticall turn location `/cats` to `{page: 'cats'}`
- Add a link somewhere which will trigger that route:
  - e.g. activate`api.app.sync.goTo('/cats')` onclick
  - e.g. add a link `<a href='/cats'>Cats!</a>` (which will be clicked up by listeners)



### Module graph

TODO!

## License

MIT
