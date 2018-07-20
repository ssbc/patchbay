const nest = require('depnest')
const { h, Value, computed, Dict, throttle, dictToCollection } = require('mutant')
const pull = require('pull-stream')
const { isMsg } = require('ssb-ref')

exports.gives = nest('app.page.calendar')

exports.needs = nest({
  'sbot.pull.stream': 'first'
})

exports.create = (api) => {
  return nest('app.page.calendar', calendarPage)

  function calendarPage (location) {
    const store = Dict({})
    pull(
      pullGatherings(2018),
      pull.drain(
        ({ key, date }) => store.put(key, date),
        (err) => {
          if (err) console.error(err)
          else console.log('DONE')
        }
      )
    )

    return h('CalendarPage', { title: '/calendar' }, [
      computed(throttle(dictToCollection(store), 150), collection => {
        const events = collection.map(item => {
          return {
            date: item.value,
            data: { key: item.key }
          }
        })

        return Calendar(events)
      })
    ])
  }

  function pullGatherings (year) {
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
      query
    }

    return pull(
      api.sbot.pull.stream(server => server.query.read(opts)),
      pull.filter(r => isMsg(r.key) && Number.isInteger(r.date)),
      pull.map(r => {
        return { key: r.key, date: new Date(r.date) }
      })
    )
  }
}

// ////////////////// extract below into a module ///////////////////////

// Thanks to nomand for the inspiration and code (https://github.com/nomand/Letnice),
// they formed the foundationf of this work

const MONTHS = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ]
const DAYS = [ 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday' ]

function Calendar (events) {
  // TODO assert events is an Array of object
  // of form { date, data }

  const year = Value(new Date().getFullYear())
  const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
  // const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 1, 0)

  const root = h('Calendar', [
    Header(year),
    h('div.months', computed(year, year => {
      return MONTHS.map((month, monthIndex) => Month({ month, monthIndex, year, today, events }))
    }))
  ])

  return root
}

function Header (year) {
  return h('div.header', [
    h('div.year', [
      year,
      h('a', { 'ev-click': () => year.set(year() - 1) }, '-'),
      h('a', { 'ev-click': () => year.set(year() + 1) }, '+')
    ])
    // h('p.percentage', yearProgress(year))
  ])
}

function Month ({ month, monthIndex, year, today, events }) {
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

    return h('CalendarDay', {
      attributes: { 'data-date': `${year}-${monthIndex + 1}-${day}` },
      style: {
        'grid-row': `${weekday} / ${weekday + 1}`,
        'grid-column': `${week + 1} / ${week + 2}`
        // column moved by 1 to make space for labels
      },
      classList: [
        date < today ? '-past' : '-future',
        eventsOnDay.length ? '-events' : ''
      ]
    })
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

