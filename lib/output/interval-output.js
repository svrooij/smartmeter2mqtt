const Output = require('./output')
const P1ReaderEvents = require('../p1-reader-events')

class IntervalOutput extends Output {
  constructor () {
    super()
    this._timer = null
    this._publishEvent = true
  }
  start (p1Reader, options = { interval: 60 }) {
    if (p1Reader === undefined) throw new Error('p1Reader is undefined!')
    if (typeof (options.interval) !== 'number') throw new Error('Interval should be a number')

    p1Reader.on(P1ReaderEvents.ParsedResult, result => {
      if (this._publishEvent) this.emit(P1ReaderEvents.ParsedResult, result)
      this._publishEvent = false
    })
    p1Reader.on(P1ReaderEvents.UsageChanged, result => this.emit(P1ReaderEvents.UsageChanged))

    this._timer = setInterval(() => {
      this._publishEvent = true
    }, options.interval * 1000)
  }

  close () {
    clearInterval(this._timer)
  }
}

module.exports = IntervalOutput
