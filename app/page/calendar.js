const nest = require('depnest')
const { h, Array: MutantArray, Struct, computed, watch, throttle } = require('mutant')
const pull = require('pull-stream')
const { isMsg } = require('ssb-ref')

exports.gives = nest('app.page.calendar')

exports.needs = nest({
  'sbot.pull.stream': 'first'
})

exports.create = (api) => {
  return nest('app.page.calendar', calendarPage)

  function calendarPage (location) {
    const d = new Date()
    const state = Struct({
      today: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
      year: d.getFullYear(),
      events: MutantArray([])
    })

    watch(state.year, year => getEvents(year, state.events))

    return h('CalendarPage', { title: '/calendar' }, [
      Calendar(state)
    ])
  }

  function getEvents (year, events) {
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
}

// ////////////////// extract below into a module ///////////////////////

// Thanks to nomand for the inspiration and code (https://github.com/nomand/Letnice),
// they formed the foundation of this work

const MONTHS = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ]
const DAYS = [ 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday' ]

function Calendar (state) {
  // TODO assert events is an Array of object
  // of form { date, data }

  return h('Calendar', [
    Header(state.year),
    h('div.months', computed(throttle(state, 100), ({ today, year, events }) => {
      return MONTHS.map((month, monthIndex) => {
        return Month({ month, monthIndex, today, year, events })
      })
    }))
  ])
}

function Header (year) {
  return h('div.header', [
    h('div.year', [
      year,
      h('a', { 'ev-click': () => year.set(year() - 1) }, '-'),
      h('a', { 'ev-click': () => year.set(year() + 1) }, '+')
    ])
  ])
}

function Month ({ month, monthIndex, today, year, events }) {
  const monthLength = new Date(year, monthIndex + 1, 0).getDate()
  // NOTE Date takes month as a monthIndex i.e. april = 3
  // and day = 0 goes back a day
  const days = Array(monthLength).fill().map((_, i) => i + 1)

  var date
  var dateEnd
  var weekday
  var week
  var offset = getDay(new Date(year, monthIndex, 1)) - 1

  return h('CalendarMonth', [
    h('div.month-name', month.substr(0, 2)),
    h('div.days', { style: {display: 'grid'} }, [
      DAYS.map((day, i) => DayName(day, i)),
      days.map(Day)
    ])
  ])

  function Day (day) {
    date = new Date(year, monthIndex, day)
    dateEnd = new Date(year, monthIndex, day + 1)
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
        eventsOnDay.length ? '-events' : ''
      ]
    }

    if (!eventsOnDay.length) return h('CalendarDay', opts)

    return h('CalendarDay', opts, [
      // TODO try a FontAwesome circle
      h('div', [
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

