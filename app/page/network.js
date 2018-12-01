const nest = require('depnest')
const { h, Value, Dict, onceTrue, computed, watchAll, throttle } = require('mutant')
const Chart = require('chart.js')
const pull = require('pull-stream')

const MINUTE = 60 * 1000
const DAY = 24 * 60 * MINUTE

const GRAPH_Y_STEP = 50
const GRAPH_Y_MIN = 100

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.network': true
})

exports.needs = nest({
  'sbot.obs.connection': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.menuItem': menuItem,
    'app.page.network': networkPage
  })

  function menuItem () {
    return h('a', {
      'ev-click': () => api.app.sync.goTo({ page: 'network' })
    }, '/network')
  }

  function networkPage (location) {
    const minsPerStep = 20
    const scale = 7 * DAY

    const data = Dict({
      [toTimeBlock(Date.now(), minsPerStep) + minsPerStep * MINUTE]: 0,
      [toTimeBlock(Date.now(), minsPerStep) + minsPerStep * MINUTE - scale]: 0
    })
    onceTrue(api.sbot.obs.connection, server => {
      getData({ data, server, minsPerStep, scale })
    })

    const latest = Value(toTimeBlock(Date.now(), minsPerStep))
    // start of the most recent bar
    setInterval(() => {
      console.log('boop')
      latest.set(toTimeBlock(Date.now(), minsPerStep))
    }, 2 * MINUTE)

    const range = computed([latest], (latest) => {
      return {
        upper: latest + minsPerStep * MINUTE,
        lower: latest + minsPerStep * MINUTE - scale
      }
    })

    //

    const canvas = h('canvas', { height: 500, width: 1200, style: { height: '500px', width: '1200px' } })
    const page = h('NetworkPage', { title: '/network' }, [
      h('div.container', [
        h('h1', 'Network'),
        h('header', `Messages received per 20-minute block over the last ${scale / DAY} days`),
        canvas
      ])
    ])

    initialiseChart({ canvas, data, range })

    return page
  }
}

function getData ({ data, server, minsPerStep, scale }) {
  const upperEnd = toTimeBlock(Date.now(), minsPerStep) + minsPerStep * MINUTE
  const lowerBound = upperEnd - scale

  const query = [
    {
      $filter: {
        timestamp: { $gte: lowerBound }
      }
    }, {
      $filter: {
        value: {
          author: { $ne: server.id }
        }
      }
    }, {
      $map: {
        ts: ['timestamp']
      }
    }
  ]

  pull(
    server.query.read({ query, live: true }),
    pull.filter(m => !m.sync),
    pull.map(m => toTimeBlock(m.ts, minsPerStep)),
    pull.drain(ts => {
      if (data.has(ts)) data.put(ts, data.get(ts) + 1)
      else data.put(ts, 1)
    })
  )
}

function initialiseChart ({ canvas, data, range }) {
  var chart = new Chart(canvas.getContext('2d'), chartConfig(range))

  const chartData = computed([throttle(data, 300), range], (data, range) => {
    return Object.keys(data)
      .filter(ts => ts >= range.lower && ts < range.upper)
      .map(ts => {
        return {
          t: Number(ts), // NOTE - might need to offset by a half-step ?
          y: data[ts]
        }
      })
  })
  chartData(data => {
    chart.data.datasets[0].data = data
    chart.update()
  })

  // Scales the height of the graph (to the visible data)!
  watchAll([chartData, range], (chartData, range) => {
    const { lower, upper } = range
    const slice = chartData
      .filter(d => d.t >= lower && d.t < upper) // unnecessary ??
      .map(d => d.y)
      .sort((a, b) => a > b ? -1 : +1)

    var h = slice[0]
    if (!h || h < GRAPH_Y_MIN) h = GRAPH_Y_MIN // min-height
    else h = h + (GRAPH_Y_STEP - h % GRAPH_Y_STEP) // round height to multiples of GRAPH_Y_STEP

    chart.options.scales.yAxes[0].ticks.max = h

    chart.update()
  })

  // Update the x-axes bounds of the graph!
  range(range => {
    const { lower, upper } = range

    chart.options.scales.xAxes[0].time.min = lower
    chart.options.scales.xAxes[0].time.max = upper

    chart.update()
  })
}

// ///// HELPERS /////

function toTimeBlock (ts, minsPerStep) {
  return Math.floor(ts / (minsPerStep * MINUTE)) * (minsPerStep * MINUTE)
}

function chartConfig ({ lower, upper }) {
  const barColor = 'hsla(215, 57%, 60%, 1)'

  return {
    type: 'bar',
    data: {
      datasets: [{
        backgroundColor: barColor,
        borderColor: barColor,
        data: []
      }]
    },
    options: {
      legend: {
        display: false
      },
      scales: {
        xAxes: [{
          type: 'time',
          distribution: 'linear',
          time: {
            // unit: 'day',
            // min: lower,
            // max: upper,
            // tooltipFormat: 'MMMM D',
            // stepSize: 7
            unit: 'minute',
            min: lower,
            max: upper,
            tooltipFormat: 'HH:mm',
            stepSize: 4 * 60
            // stepSize: 240
          },
          bounds: 'ticks',
          ticks: {
            // maxTicksLimit: 4 // already disabled
          },
          gridLines: {
            display: false
          }
          // maxBarThickness: 2
        }],

        yAxes: [{
          ticks: {
            min: 0,
            stepSize: GRAPH_Y_STEP,
            suggestedMax: GRAPH_Y_MIN
          }
        }]
      },
      animation: {
        // duration: 300
      }
    }
  }
}
