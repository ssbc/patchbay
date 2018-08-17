const nest = require('depnest')
const { h, Array: MutantArray, map, Struct, computed, watch, throttle, resolve } = require('mutant')
const Month = require('marama')

const pull = require('pull-stream')
const { isMsg } = require('ssb-ref')

exports.gives = nest({
  'app.page.calendar': true,
  'app.html.menuItem': true
})

exports.needs = nest({
  'app.sync.goTo': 'first',
  'keys.sync.id': 'first',
  'message.html.render': 'first',
  'sbot.async.get': 'first',
  'sbot.pull.stream': 'first'
})

exports.create = (api) => {
  return nest({
    'app.html.menuItem': menuItem,
    'app.page.calendar': calendarPage
  })

  function menuItem () {
    return h('a', {
      'ev-click': () => api.app.sync.goTo({ page: 'calendar' })
    }, '/calendar')
  }

  function calendarPage (location) {
    const d = startOfDay()
    const state = Struct({
      today: d,
      year: d.getFullYear(),
      events: MutantArray([]),
      attending: MutantArray([]),
      range: Struct({
        gte: d,
        lt: endOfDay(d)
      })
    })

    watch(state.year, year => getGatherings(year, state.events, api))
    watchAttending(state.attending, api)

    const page = h('CalendarPage', { title: '/calendar' }, [
      Calendar(state),
      Events(state, api)
    ])

    page.scroll = (i) => scroll(state.range, i)

    return page
  }
}

function scroll (range, i) {
  const { gte, lt } = resolve(range)

  if (isMonthInterval(gte, lt)) {
    range.gte.set(new Date(gte.getFullYear(), gte.getMonth() + i, gte.getDate()))
    range.lt.set(new Date(lt.getFullYear(), lt.getMonth() + i, lt.getDate()))
    return
  }

  if (isWeekInterval(gte, lt)) {
    range.gte.set(new Date(gte.getFullYear(), gte.getMonth(), gte.getDate() + 7 * i))
    range.lt.set(new Date(lt.getFullYear(), lt.getMonth(), lt.getDate() + 7 * i))
    return
  }

  range.gte.set(new Date(gte.getFullYear(), gte.getMonth(), gte.getDate() + i))
  range.lt.set(new Date(lt.getFullYear(), lt.getMonth(), lt.getDate() + i))

  function isMonthInterval (gte, lt) {
    return gte.getDate() === 1 && // 1st of month
      lt.getDate() === 1 && // to the 1st of the month
      gte.getMonth() + 1 === lt.getMonth() && // one month gap
      gte.getFullYear() === lt.getFullYear()
  }

  function isWeekInterval (gte, lt) {
    return gte.getDay() === 1 && // from monday
      lt.getDay() === 1 && // to just inside monday
      new Date(gte.getFullYear(), gte.getMonth(), gte.getDate() + 7).toISOString() === lt.toISOString()
  }
}

function Events (state, api) {
  return h('CalendarEvents', computed([state.events, state.range], (events, range) => {
    const keys = events
      .filter(ev => ev.date >= range.gte && ev.date < range.lt)
      .sort((a, b) => a.date - b.date)
      .map(ev => ev.data.key)

    const gatherings = MutantArray([])

    pull(
      pull.values(keys),
      pull.asyncMap((key, cb) => {
        api.sbot.async.get(key, (err, value) => {
          if (err) return cb(err)
          cb(null, {key, value})
        })
      }),
      pull.drain(msg => gatherings.push(msg))
    )

    return map(gatherings, g => api.message.html.render(g))
  }))
}

function watchAttending (attending, api) {
  const myKey = api.keys.sync.id()

  const query = [{
    $filter: {
      value: {
        author: myKey,
        content: {
          type: 'about',
          about: { $is: 'string' },
          attendee: { link: myKey }
        }
      }
    }
  }, {
    $map: {
      key: ['value', 'content', 'about'], // gathering
      rm: ['value', 'content', 'attendee', 'remove']
    }
  }]

  const opts = { reverse: false, live: true, query }

  pull(
    api.sbot.pull.stream(server => server.query.read(opts)),
    pull.filter(m => !m.sync),
    pull.filter(Boolean),
    pull.drain(({ key, rm }) => {
      var hasKey = attending.includes(key)

      if (!hasKey && !rm) attending.push(key)
      else if (hasKey && rm) attending.delete(key)
    })
  )
}

function getGatherings (year, events, api) {
  // gatherings specify times with `about` messages which have a startDateTime
  // NOTE - this gets a window of about messages around the current year but does not gaurentee
  //        that we got all events in this year (e.g. something booked 6 months agead would be missed)
  const query = [{
    $filter: {
      value: {
        timestamp: { // ordered by published time
          $gt: Number(new Date(year - 1, 11, 1)),
          $lt: Number(new Date(year + 1, 0, 1))
        },
        content: {
          type: 'about',
          startDateTime: {
            epoch: {$gt: 0}
          }
        }
      }
    }
  }, {
    $map: {
      key: ['value', 'content', 'about'], // gathering
      date: ['value', 'content', 'startDateTime', 'epoch']
    }
  }]

  const opts = { reverse: false, live: true, query }

  pull(
    api.sbot.pull.stream(server => server.query.read(opts)),
    pull.filter(m => !m.sync),
    pull.filter(r => isMsg(r.key) && Number.isInteger(r.date)),
    pull.map(r => {
      return { key: r.key, date: new Date(r.date) }
    }),
    pull.drain(({ key, date }) => {
      var target = events.find(ev => ev.data.key === key)
      if (target && target.date <= date) events.delete(target)

      events.push({ date, data: { key } })
    })
  )
}

// ////////////////// extract below into a module ///////////////////////

// Thanks to nomand for the inspiration and code (https://github.com/nomand/Letnice),
// they formed the foundation of this work

// Calendar takes events of format { date: Date, data: { attending: Boolean, ... } }

function Calendar (state) {
  // TODO assert events is an Array of object
  // of form { date, data }

  return h('Calendar', [
    h('div.header', [
      h('div.year', [
        state.year,
        h('a', { 'ev-click': () => state.year.set(state.year() - 1) }, '-'),
        h('a', { 'ev-click': () => state.year.set(state.year() + 1) }, '+')
      ])
    ]),
    h('div.months', computed(throttle(state, 100), ({ today, year, events, attending, range }) => {
      events = events.map(ev => {
        ev.data.attending = attending.includes(ev.data.key)
        return ev
      })

      return Array(12).fill(0).map((_, i) => {
        return Month({ year, month: i + 1, events, range, setRange })
      })
    }))
  ])

  function setRange ({ gte, lt }) {
    // TODO some type checking
    if (gte) state.range.gte.set(gte)
    if (lt) state.range.lt.set(lt)
  }
}

function startOfDay (d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function endOfDay (d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
}
