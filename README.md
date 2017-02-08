# patchbay

Prototype of a pluggable patchwork.

`patchbay` is an secure-scuttlebutt client interface
that is fully compatible with [patchwork](https://github.com/ssbc/patchwork)

I started `patchbay` to experiment with a different internal architecture
based on [depject](https://github.com/dominictarr/depject). The goal was
to make it easier to develop new features, and enable or disable features.
This has so far been quite successful!

This makes in very easy to create say, a renderer for a new message type,
or switch to a different method for choosing user names.

## Running

```
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
now clone and run patchbay.
```
git clone https://github.com/ssbc/patchbay.git
cd patchbay
npm install
npm run rebuild
npm run bundle
npm start
```

## Lite

To run a lite client in the browser instead of using electron, use npm
run lite from the prompt instead of run bundle. After that you need to
generate a modern invite:

```
sbot invite.create --modern
```

Also set up sbot to allow these connections with:

```
sbot server --allowPrivate
```

Lastly open build/index.html in a browser and append the invite
created above using: index.html#ws://localhost:8989....

## how to add a feature

To add a new message type, add add a js to `./modules/` that
exports a function named `message_content` (it should return an html element)
To add a new tab, export a function named `page` (returns an html element)

To add a new detail, that appears above a message,
export a function named `message_meta`.

see the code for more examples.

## module graph

patchbay uses [depject](http://github.com/dominictarr/depject) to manage it's modules.
here is a graph of the current connections between them. (round shows module,
square shows api, arrow direction points from user to provider)

[module graph](./graph.svg)

## License

MIT





