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
  'feed':     require('./feed'),
  'follow':   require('./follow'),
  'invite':   require('./invite'),
  'like':     require('./like'),
  'markdown': require('./markdown'),
  'message': {
    'author':    require('./message/author'),
    'backlinks': require('./message/backlinks'),
    'link':      require('./message/link'),
    'name':      require('./message/name'),
    'render':    require('./message/render'),
  },
  'names':            require('./names'),
  'post':             require('./post'),
  'private':          require('./private'),
  'pub':              require('./pub'),
  'public':           require('./public'),
  'relationships':    require('./relationships'),
  'reply':            require('./reply'),
  'search-box':       require('./search-box'),
  'setup':            require('./setup'),
  'suggest-mentions': require('./suggest-mentions'),
  'thread':           require('./thread'),
  'timestamp':        require('./timestamp')
}

