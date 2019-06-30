const { h, Value, Dict, onceTrue, computed, watch, watchAll, throttle } = require('mutant')
const Chart = require('chart.js')
const pull = require('pull-stream')

const MINUTE = 60 * 1000
const DAY = 24 * 60 * MINUTE

const GRAPH_Y_MIN_STEP = 50
const GRAPH_Y_MIN = 100

module.exports = function ReplicationIn ({ connection }) {
  const minsPerStep = 10
  const scale = 1 * DAY
  const height = 300
  const width = 800

  const state = buildState({ connection, minsPerStep, scale })
  const canvas = h('canvas', { height, width, style: { height: `${height}px`, width: `${width}px` } })

  const body = h('ReplicationIn', [
    h('p', `Messages received per ${minsPerStep}-minute block over the last ${scale / DAY} days`),
    canvas
  ])
  // TODO hook to abort streams

  initialiseChart({ state, canvas })

  return {
    title: 'Incoming Traffic',
    body
  }
}

function buildState ({ connection, minsPerStep, scale }) {
  // build data, range
  const data = Dict({
    [toTimeBlock(Date.now(), minsPerStep) + minsPerStep * MINUTE]: 0,
    [toTimeBlock(Date.now(), minsPerStep) + minsPerStep * MINUTE - scale]: 0
  })
  onceTrue(connection, server => {
    getData({ data, server, minsPerStep, scale })
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
    data, // TODO rename this !!
    range
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

function toTimeBlock (ts, minsPerStep) {
  return Math.floor(ts / (minsPerStep * MINUTE)) * (minsPerStep * MINUTE)
}

function initialiseChart ({ canvas, state: { data, range } }) {
  var chart = new Chart(canvas.getContext('2d'), chartConfig(range))

  watch(range, ({ lower, upper }) => {
    // set horizontal scale
    chart.options.scales.xAxes[0].time.min = lower
    chart.options.scales.xAxes[0].time.max = upper
    chart.update()
  })

  watchAll([throttle(data, 300), range], (data, { lower, upper }) => {
    const _data = Object.keys(data)
      .sort((a, b) => a < b ? -1 : +1)
      .map(ts => {
        return {
          t: Number(ts), // NOTE - might need to offset by a half-step ?
          y: data[ts]
        }
      })

    // update chard data
    chart.data.datasets[0].data = _data

    // scales the height of the graph (to the visible data)!
    const slice = _data
      .filter(d => d.t >= lower && d.t < upper)
      .map(d => d.y)
      .sort((a, b) => a > b ? -1 : +1)

    var max = slice[0]
    var stepSize = GRAPH_Y_MIN_STEP
    if (!max || max < GRAPH_Y_MIN) max = GRAPH_Y_MIN // min-height
    else {
      while ((max / stepSize) > 7) stepSize = stepSize * 2
      max = Math.ceil(max / stepSize) * stepSize // round height to multiples of stepSize
      // max = max + (stepSize - max % stepSize) 
    }

    chart.options.scales.yAxes[0].ticks.max = max
    chart.options.scales.yAxes[0].ticks.stepSize = stepSize // not sure this works

    chart.update()
  })
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
          },
          maxBarThickness: 4
        }],

        yAxes: [{
          ticks: {
            min: 0,
            maxTicksLimit: 7,
            stepSize: GRAPH_Y_MIN_STEP,
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
