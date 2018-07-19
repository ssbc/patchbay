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
  const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 1, 0)

  const root = computed(year, year => {
    return h('Calendar', [
      Header(year),
      MONTHS.map((month, i) => {
        return h('div.month', [
          h('div.label', month.substr(0, 3)),
          h('div.graph', [
            // Labels(),
            Month(year, i)
          ])
        ])
      })
    ])
  })

  return root

  function Header (year) {
    return h('div.header', [
      h('p.year', [
        year,
        h('a', { 'ev-click': () => year.set(year() - 1) }, '-'),
        h('a', { 'ev-click': () => year.set(year() + 1) }, '+')
      ])
      // h('p.percentage', yearProgress(year))
    ])
  }

  // function yearProgress (year) {
  //   const diff = new Date() - new Date(year, 0, 1, 0)
  //   const progress = ((diff / 31536000000) * 100).toFixed(2)
  //   const yd = Math.abs((progress / 100).toFixed(2))

  //   return progress < 0 ? yd + ` YEARS AWAY` : progress > 100 ? yd + ` YEARS AGO` : progress + '%'
  // }

  // function doLabels () {
  //   let html = ''
  //   let y = 0

  //   for (var i = 0; i < 7; i++) {
  //     y = (i * 14)
  //     html += `<text class="dayLabel" x="5" y='${y}' dy="10">${DAYS[i].substr(0, 1)}</text>`
  //   }
  //   return html
  // }

  function Month (year, monthIndex) {
    const monthLength = new Date(year, monthIndex + 1, 0).getDate()
    // NOTE Date takes month as a monthIndex i.e. april = 3
    // and day = 0 goes back a day
    const days = Array(monthLength).fill().map((_, i) => i + 1)

    const style = {
      display: 'grid',
      'grid-gap': '.2rem'
    }

    var date
    var weekday
    var week
    var offset = getDay(new Date(year, monthIndex, 1)) - 1

    return h('div', { style }, days.map(day => {
      date = new Date(year, monthIndex, day)
      weekday = getDay(date)
      if (weekday === 0) weekday = 7 //  urghh I want monday to be the start of the week
      week = Math.ceil((day + offset) / 7)

      return h('div.day', {
        attributes: { 'data-day': day },
        style: {
          'grid-row': `${weekday} / ${weekday + 1}`,
          'grid-column': `${week} / ${week + 1}`
        }
      })
    }))
  }

  function getDay (date) {
    const d = date.getDay()
    return d === 0 ? 7 : d

    // Weeks run 0...6 (Sun - Sat)
    // this shifts those days around by 1
  }

          function doMonth (moxsd ........
    .th) {
    var html = ''
    const monthLength = new Date(year, month + 1, 0).getDate()
    let date = 0
    let x = 0
    let y = 0

    while (date < monthLength) {
      x += 14
      let week = 0

      while (week < 7 && date !== monthLength) {
        y = week * 14
        let day = new Date(year, month, date, 0)
        let dotab = `tabIndex="0"`

        if (day.getDay() !== week) {
          style = 'null'
          dotab = ''
          date--
        } else if (String(day) === String(today)) {
          style = 'today'
        } else if (day < today) {
          style = 'gone'
        } else if (day.getDay() === 5 || day.getDay() === 6) {
          style = 'weekend'
        } else {
          style = 'day'
        }

        html += `<rect id="square" class='${style}' x='${x}' y='${y}' title='${(date + 1) === 0 ? 'null' : DAYS[week] + ' ' + (date + 1)}' width="12px" height="12px" rx="2" ry="2" onclick="
        UpdateFooter(${year}, ${month}, ${(date + 1)}, ${week}, this)" onblur="" ${dotab}></rect>`

        week++
        date++
      }
    }
    return html
  }
}

function UpdateFooter (year, month, date, week, obj) {
  obj.addEventListener('blur', () => { footer.innerHTML = '' })
  let diff = ((new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0) - new Date(year, month, date)) / 86400000)
  let num = Math.abs(diff).toFixed()
  let calc

  diff < 0 ? calc = `In ${num} Day${num > 1 ? 's' : ''}.` : diff == 0 ? calc = `Today.` : calc = `${num} Day${num > 1 ? 's' : ''} ago.`
  footer.innerHTML = `${MONTHS[month]} ${date}, ${DAYS[week]}. ${calc}`
}

function getYear (diff) {
  location.hash = parseInt(location.hash.replace('#', '')) + parseInt(diff)
}

// window.onhashchange = function () {
//   Year(parseInt(location.hash.replace('#', '')))
// }
