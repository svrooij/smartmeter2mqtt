const IntervalOutput = require('./interval-output')
const P1ReaderEvents = require('../p1-reader-events')
const fetch = require('node-fetch')

class HttpOutput extends IntervalOutput {
  constructor () {
    super()
    this._url = ''
    this._method = 'post'
    this._postJson = false
    this._fields = null
  }

  start (p1Reader, options = {}) {
    options = Object.assign(HttpOutput.DefaultOptions, options)
    super.start(p1Reader, options)
    this._url = options.url
    this._postJson = options.postJson === true
    if (options.fields) this._fields = options.fields.split(',')
    this.on(P1ReaderEvents.ParsedResult, this._sendEvent)
  }

  static get DefaultOptions () {
    return {
      interval: 300,
      url: '',
      postJson: false,
      fields: 'powerTs,totalT1Use,totalT1Delivered,totalT2Use,totalT1Delivered,gas_totalUse,gas_ts'
    }
  }

  _sendEvent (data) {
    const self = this
    data = this._flatten(data)
    if (this._fields) data = this._filterData(data)
    const params = this._postJson ? {
      method: 'post',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    } : {
      method: 'post',
      body: new URLSearchParams(data)
    }
    fetch(this._url, params)
      .then(result => {
        if (!result.ok) throw new Error(result.statusText)
      })
      .catch(err => {
        self.emit(P1ReaderEvents.ErrorMessage, err)
      })
  }

  _filterData (data) {
    const filtered = Object.keys(data)
      .filter(key => this._fields.includes(key))
      .reduce((obj, key) => {
        obj[key] = data[key]
        return obj
      }, {})
    return filtered
  }

  _flatten (data) {
    if (data.gas) {
      data['gas_ts'] = data.gas.ts
      data['gas_totalUse'] = data.gas.totalUse
      delete data.gas
    }
    return data
  }
}

module.exports = HttpOutput
