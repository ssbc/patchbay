const nest = require('depnest')
const { h, Value, computed } = require('mutant')

exports.gives = nest('app.page.calendar')

exports.needs = nest({
})

exports.create = (api) => {
  return nest('app.page.calendar', calendarPage)

  function calendarPage (location) {
    const cal = Cal()

    return h('CalendarPage', { title: '/calendar' }, cal)
  }
}

const MONTHS = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ]
const DAYS = [ 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday' ]

function Cal () {
  const year = Value(new Date().getFullYear())
  const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
  // const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 1, 0)

  const root = h('Calendar', [
    Header(year),
    h('div.months', computed(year, year => {
      return MONTHS.map((month, monthIndex) => Month({ month, monthIndex, year, today }))
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

function Month ({ month, monthIndex, year, today }) {
  const monthLength = new Date(year, monthIndex + 1, 0).getDate()
  // NOTE Date takes month as a monthIndex i.e. april = 3
  // and day = 0 goes back a day
  const days = Array(monthLength).fill().map((_, i) => i + 1)

  var date
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
    weekday = getDay(date)
    week = Math.ceil((day + offset) / 7)

    return h('CalendarDay', {
      attributes: { 'data-date': `${year}-${monthIndex + 1}-${day}` },
      style: {
        'grid-row': `${weekday} / ${weekday + 1}`,
        'grid-column': `${week + 1} / ${week + 2}`
        // column moved by 1 to make space for labels
      },
      classList: [
        date < today ? '-past' : '-future'
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
