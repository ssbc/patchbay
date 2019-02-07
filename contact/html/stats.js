const nest = require('depnest')
const { h, onceTrue, computed, Value, Dict, watch, watchAll, throttle } = require('mutant')
const Chart = require('chart.js')
const pull = require('pull-stream')

exports.gives = nest('contact.html.stats')

exports.needs = nest({
  'sbot.obs.connection': 'first'
})

const MINUTE = 60 * 1000
const DAY = 24 * 60 * MINUTE

const GRAPH_Y_STEP = 20
const GRAPH_Y_MIN = 20

exports.create = function (api) {
  return nest({
    'contact.html.stats': stats
  })

  function stats (feedId) {
    const minsPerStep = 60 * 24
    const scale = 90 * DAY

    const state = buildState({ api, feedId, minsPerStep, scale })
    const canvas = h('canvas', { height: 200, width: 1200, style: { height: '200px', width: '1200px' } })

    const stats = h('ContactStats', [
      canvas
    ])

    initialiseChart({ canvas, state })
    return stats
  }
}

function initialiseChart ({ canvas, state: { data, range } }) {
  var chart = new Chart(canvas.getContext('2d'), chartConfig(range))

  watch(range, ({ lower, upper }) => {
    // set horizontal scale
    chart.options.scales.xAxes[0].time.min = lower
    chart.options.scales.xAxes[0].time.max = upper
    chart.update()
  })

  watchAll([throttle(data.pub, 300), throttle(data.pri, 300), range], (dataPub, dataPri, { lower, upper }) => {
    const _dataPub = Object.keys(dataPub)
      .sort((a, b) => a < b ? -1 : +1)
      .map(ts => {
        return {
          t: Number(ts), // NOTE - might need to offset by a half-step ?
          y: dataPub[ts]
        }
      })
    const _dataPri = Object.keys(dataPri)
      .sort((a, b) => a < b ? -1 : +1)
      .map(ts => {
        return {
          t: Number(ts), // NOTE - might need to offset by a half-step ?
          y: dataPri[ts]
        }
      })

    // update chard data
    chart.data.datasets[0].data = _dataPub
    chart.data.datasets[1].data = _dataPri

    // scales the height of the graph (to the visible data)!
    const slice = _dataPub
      .filter(d => d.t >= lower && d.t < upper)
      .map(d => d.y)
      .sort((a, b) => a > b ? -1 : +1)

    var h = slice[0]
    if (!h || h < GRAPH_Y_MIN) h = GRAPH_Y_MIN // min-height
    else h = h + (GRAPH_Y_STEP - h % GRAPH_Y_STEP) // round height to multiples of GRAPH_Y_STEP
    chart.options.scales.yAxes[0].ticks.max = h

    chart.options.scales.yAxes[0].ticks.min = -h

    chart.update()
  })
}

// ///// HELPERS /////

function buildState ({ api, feedId, minsPerStep, scale }) {
  const data = {
    pub: Dict({
      [toTimeBlock(Date.now(), minsPerStep) + minsPerStep * MINUTE]: 0,
      [toTimeBlock(Date.now(), minsPerStep) + minsPerStep * MINUTE - scale]: 0
    }),
    pri: Dict({
      [toTimeBlock(Date.now(), minsPerStep) + minsPerStep * MINUTE]: 0,
      [toTimeBlock(Date.now(), minsPerStep) + minsPerStep * MINUTE - scale]: 0
    })
  }
  onceTrue(api.sbot.obs.connection, server => {
    getData({ data, server, feedId, minsPerStep, scale })
  })

  const latest = Value(toTimeBlock(Date.now(), minsPerStep))
  // start of the most recent bar
  setInterval(() => {
    latest.set(toTimeBlock(Date.now(), minsPerStep))
  }, minsPerStep / 4 * MINUTE)

  const range = computed([latest], (latest) => {
    return {
      upper: latest + minsPerStep * MINUTE,
      lower: latest + minsPerStep * MINUTE - scale
    }
  })

  return {
    data,
    range
  }
}

function getData ({ data, server, feedId, minsPerStep, scale }) {
  const upperEnd = toTimeBlock(Date.now(), minsPerStep) + minsPerStep * MINUTE
  const lowerBound = upperEnd - scale

  const query = [
    {
      $filter: {
        timestamp: { $gte: lowerBound },
        value: {
          author: feedId
        }
      }
    }, {
      $map: {
        ts: ['timestamp'],
        content: ['value', 'content']
      }
    }
  ]

  pull(
    server.query.read({ query, live: true }),
    pull.filter(m => !m.sync),
    pull.map(m => {
      return {
        t: toTimeBlock(m.ts, minsPerStep),
        isPrivate: typeof m.content === 'string' || Array.isArray(m.content.recps)
      }
    }),
    pull.drain(m => {
      if (!m.isPrivate) {
        if (data.pub.has(m.t)) data.pub.put(m.t, data.pub.get(m.t) + 1)
        else data.pub.put(m.t, 1)
      } else {
        if (data.pri.has(m.t)) data.pri.put(m.t, data.pri.get(m.t) - 1)
        else data.pri.put(m.t, -1)
      }
    })
  )
}

function toTimeBlock (ts, minsPerStep) {
  return Math.floor(ts / (minsPerStep * MINUTE)) * (minsPerStep * MINUTE)
}

function chartConfig ({ lower, upper }) {
  const barColor0 = 'hsla(290, 70%, 40%, 1)'
  const barColor1 = 'hsla(0, 0%, 0%, 1)'

  return {
    type: 'bar',
    data: {
      datasets: [{
        backgroundColor: barColor0,
        borderColor: barColor0,
        data: []
      }, {
        backgroundColor: barColor1,
        borderColor: barColor1,
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
            min: lower,
            max: upper,
            stepSize: 4 * 60,
            tooltipFormat: 'MMMM D',
            unit: 'day'
          },
          bounds: 'ticks',
          gridLines: { display: false },
          stacked: true
        }],

        yAxes: [{
          ticks: {
            min: 0,
            stepSize: GRAPH_Y_STEP,
            suggestedMax: GRAPH_Y_MIN
          },
          stacked: true
        }]
      },
      animation: {
        // duration: 300
      }
    }
  }
}
