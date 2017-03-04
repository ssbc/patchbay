# patchbay

Prototype of a pluggable patchwork.

`patchbay` is a secure-scuttlebutt client interface that is fully compatible with [patchwork](https://github.com/ssbc/patchwork).

I started `patchbay` to experiment with a different internal architecture based on [depject](https://github.com/dominictarr/depject). The goal was to make it easier to develop new features, and enable or disable features. This has so far been quite successful!

This makes in very easy to create say, a renderer for a new message type, or switch to a different method for choosing user names.


## Setup

Libsodium has some build dependencies. On *ubuntu systems the following might help:

```sh
sudo apt-get install m4 libtool eclipse-cdt-autotools
```

Install Scuttlebot (your gossip server)

```sh
npm install scuttlebot@latest -g

# make sure you have secure-scuttlebutt@15.2.0
npm ls secure-scuttlebutt -g

sbot server
# if you are already running patchwork, that also works.
# (must have at least >= 2.8)

# then in another tab (these must be separate commands)
sbot plugins.install ssb-links
sbot plugins.install ssb-query
sbot plugins.install ssb-ws
sbot plugins.install ssb-fulltext # for faster searches (optional)

# restart sbot server (go back to previous tab and kill it)
```

Restart your sbot, then (optionally) use an invite code. This will give you your first friend, from which point you can find others:
```
 sbot invite.accept LONG_INVITE_CODE_MAYBE_IN_QUOTES
```

Install Patchbay (an interface for the your scuttlebutt database)

```sh
git clone https://github.com/ssbc/patchbay.git
cd patchbay
npm install
```


## Running the desktop app

From inside the patchbay repo folder, 

```sh
npm run rebuild
npm start
```


## Running in the browser

Make sure scuttlebot is allowing private connections. Stop any running sbot server, restart it with the `--allowPrivate` option and create a new modern invite:

```sh
sbot server --allowPrivate
sbot invite.create --modern
```

From inside the patchbay repo folder, run `npm run lite`.

Lastly open `build/index.html` in a browser and append the invite
created above using: index.html#ws://localhost:8989....


## How to add a feature

To add a new message type, add add a js to `./modules/` that exports a function named `message_content` (it should return an HTML element). To add a new tab, export a function named `screen_view` (returns an html element).

To add a new detail, that appears above a message, export a function named `message_meta`.

See the code for more examples.


## Module graph

patchbay uses [depject](http://github.com/dominictarr/depject) to manage it's modules. Here is a graph of the current connections between them (round shows module, square shows api, arrow direction points from user to provider).

[module graph](./graph.svg)


## License

MIT

