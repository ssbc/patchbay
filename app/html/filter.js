const nest = require('depnest')
const { h, Value, when } = require('mutant')
const Abort = require('pull-abortable')
const pull = require('pull-stream')

exports.gives = nest('app.html.filter')

exports.needs = nest({
  'contact.obs.following': 'first',
  'keys.sync.id': 'first'
})


exports.create = function (api) {
  return nest({
    'app.html.filter': Filter
  })

  function Filter (draw) {

    const showFilters = Value(false)

    const myId = api.keys.sync.id()
    const peopleIFollow = api.contact.obs.following(myId)
    const onlyPeopleIFollow = Value(false)

    const filterMenu = h('Filter', [ 
      h('i', { 
         classList: when(showFilters, 'fa fa-filter -active', 'fa fa-filter'),
        'ev-click': () => showFilters.set(!showFilters()) 
      }),
      when(showFilters, 
        h('section', [
          h('a', { 'ev-click': draw }, [
            h('i.fa.fa-refresh') , 'refresh',
          ]),
          h('a', { 
            'ev-click': () => {
              onlyPeopleIFollow.set(!onlyPeopleIFollow())
              draw()
            }
          }, [
            h('i', { classList: when(onlyPeopleIFollow, 'fa fa-check-square-o', 'fa fa-square-o') }),
            'people i follow'
          ]),
        ])
      )
    ])

    var downScrollAborter

    function filterDownThrough () {
      return pull(
        downScrollAborter,
        pull.filter(m => onlyPeopleIFollow() 
          ? Array.from(peopleIFollow()).includes(m.value.author)
          : true
        )
      )
    }

    var upScrollAborter

    function filterUpThrough () {
      return pull(
        upScrollAborter,
        pull.filter(m => onlyPeopleIFollow() 
          ? Array.from(peopleIFollow()).includes(m.value.author)
          : true
        )
      )
    }

    function resetFeed ({ container, content }) {
      if (typeof upScrollAborter === 'function') {
        upScrollAborter.abort()
        downScrollAborter.abort()
      }
      upScrollAborter = Abort()
      downScrollAborter = Abort()

      container.scroll(0)
      content.innerHTML = ''
    }

    return {
      filterMenu,
      filterDownThrough,
      filterUpThrough,
      resetFeed
    }
  }
}
    
