const nest = require('depnest')
const { h, Array: MutantArray, map, Struct, computed, watch, throttle, resolve } = require('mutant')

const pull = require('pull-stream')
const { isMsg } = require('ssb-ref')

exports.gives = nest({
  'app.page.calendar': true,
  'app.html.menuItem': true
})

exports.needs = nest({
  'message.html.render': 'first',
  'app.sync.goTo': 'first',
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
      style: { order: 1 },
      'ev-click': () => api.app.sync.goTo({ page: 'calendar' })
    }, '/calendar')
  }

  function calendarPage (location) {
    const d = new Date()
    const state = Struct({
      today: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
      year: d.getFullYear(),
      events: MutantArray([]),
      range: Struct({
        gte: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        lt: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
      })
    })

    watch(state.year, year => getEvents(year, state.events, api))

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
    return gte.getDate() === 1 &&             // 1st of month
      lt.getDate() === 1 &&                   // to the 1st of the month
      gte.getMonth() + 1 === lt.getMonth() && // one month gap
      gte.getFullYear() === lt.getFullYear()
  }

  function isWeekInterval (gte, lt) {
    console.log(
      new Date(gte.getFullYear(), gte.getMonth(), gte.getDate() + 7).toISOString() === lt.toISOString(),
      new Date(gte.getFullYear(), gte.getMonth(), gte.getDate() + 7).toISOString(),
      lt.toISOString(),
    )
    return gte.getDay() === 1 && // from monday
      lt.getDay() === 1 &&      // to just inside monday
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

function getEvents (year, events, api) {
  const query = [{
    $filter: {
      value: {
        timestamp: {$gt: Number(new Date(year, 0, 1))}, // ordered by published time
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

  const opts = {
    reverse: false,
    live: true,
    query
  }

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

const MONTHS = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ]
const DAYS = [ 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday' ]

function Calendar (state) {
  // TODO assert events is an Array of object
  // of form { date, data }

  const { gte, lt } = state.range

  return h('Calendar', [
    h('div.header', [
      h('div.year', [
        state.year,
        h('a', { 'ev-click': () => state.year.set(state.year() - 1) }, '-'),
        h('a', { 'ev-click': () => state.year.set(state.year() + 1) }, '+')
      ])
    ]),
    h('div.months', computed(throttle(state, 100), ({ today, year, events, range }) => {
      return MONTHS.map((month, monthIndex) => {
        return Month({ month, monthIndex, today, year, events, range, gte, lt })
      })
    }))
  ])
}

function Month ({ month, monthIndex, today, year, events, range, gte, lt }) {
  const monthLength = new Date(year, monthIndex + 1, 0).getDate()
  // NOTE Date takes month as a monthIndex i.e. april = 3
  // and day = 0 goes back a day
  const days = Array(monthLength).fill().map((_, i) => i + 1)

  var weekday
  var week
  var offset = getDay(new Date(year, monthIndex, 1)) - 1

  const setMonthRange = (ev) => {
    gte.set(new Date(year, monthIndex, 1))
    lt.set(new Date(year, monthIndex + 1, 1))
  }

  return h('CalendarMonth', [
    h('div.month-name', { 'ev-click': setMonthRange }, month.substr(0, 2)),
    h('div.days', { style: {display: 'grid'} }, [
      DAYS.map((day, i) => DayName(day, i)),
      days.map(Day)
    ])
  ])

  function Day (day) {
    const date = new Date(year, monthIndex, day)
    const dateEnd = new Date(year, monthIndex, day + 1)
    weekday = getDay(date)
    week = Math.ceil((day + offset) / 7)

    const eventsOnDay = events.filter(e => {
      return e.date >= date && e.date < dateEnd
    })

    const opts = {
      attributes: {
        'title': `${year}-${monthIndex + 1}-${day}`,
        'data-date': `${year}-${monthIndex + 1}-${day}`
      },
      style: {
        'grid-row': `${weekday} / ${weekday + 1}`,
        'grid-column': `${week + 1} / ${week + 2}`
        // column moved by 1 to make space for labels
      },
      classList: [
        date < today ? '-past' : '-future',
        eventsOnDay.length ? '-events' : '',
        date >= range.gte && date < range.lt ? '-selected' : ''
      ],
      'ev-click': (ev) => {
        if (ev.shiftKey) {
          dateEnd >= resolve(lt) ? lt.set(dateEnd) : gte.set(date)
          return
        }

        gte.set(date)
        lt.set(dateEnd)
      }
    }

    if (!eventsOnDay.length) return h('CalendarDay', opts)

    return h('CalendarDay', opts, [
      // TODO add awareness of whether I'm going to events
      // TODO try a FontAwesome circle
      h('div.dot', [
        // Math.random() > 0.3 ? h('div') : ''
      ])
    ])
  }
}

function DayName (day, index) {
  return h('CalendarDayName', {
    style: {
      'grid-row': `${index + 1} / ${index + 2}`,
      'grid-column': '1 / 2'
    }
  }, day.substr(0, 1))
}

function getDay (date) {
  const dayIndex = date.getDay()
  return dayIndex === 0 ? 7 : dayIndex

  // Weeks run 0...6 (Sun - Sat)
  // this shifts those days around by 1
}
