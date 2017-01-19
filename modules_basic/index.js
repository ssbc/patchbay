module.exports = {
  'about': require('./about'),
  'avatar': {
    'edit':    require('./avatar/edit'),
    'image':   require('./avatar/image'),
    'link':    require('./avatar/link'),
    'name':    require('./avatar/name'),
    'profile': require('./avatar/profile'),
    'avatar':  require('./avatar/avatar')
  },
  'compose':  require('./compose'),
  'emoji':    require('./emoji'),
  'feed':     require('./feed'),
  'follow':   require('./follow'),
  'invite':   require('./invite'),
  'like':     require('./like'),
  'markdown': require('./markdown'),
  'message': {
    'author':    require('./message/author'),
    'backlinks': require('./message/backlinks'),
    'confirm':   require('./message/confirm'),
    'link':      require('./message/link'),
    'name':      require('./message/name'),
    'render':    require('./message/render'),
  },
  'post':             require('./post'),
  'private':          require('./private'),
  'pub':              require('./pub'),
  'public':           require('./public'),
  'relationships':    require('./relationships'),
  'reply':            require('./reply'),
  'setup':            require('./setup'),
  'thread':           require('./thread'),
  'timestamp':        require('./timestamp')
}

