const Output = require('./output')
const P1ReaderEvents = require('../p1-reader-events')
const Mqtt = require('mqtt')

class MqttOutput extends Output {
  constructor () {
    super()
    this._mqtt = null
    this._options = {}
  }

  start (p1Reader, options = {}) {
    this._options = Object.assign(MqttOutput.DefaultOptions, options)
    this._mqtt = Mqtt.connect(this._options.url)
    this._mqtt.on('connect', () => {
      this._mqtt.publish(`${this._options.topic}/connected`, '2', { qos: 0, retain: true })
    })
    p1Reader.on(P1ReaderEvents.ParsedResult, data => {
      this._publishData(data)
    })
    p1Reader.on(P1ReaderEvents.UsageChanged, data => {
      this._publishUsage(data)
    })
  }

  async stop () {
    return new Promise((resolve, reject) => {
      this._mqtt.end(false, {}, resolve)
    })
  }

  get MqttOptions () {
    return {
      will: {
        topic: `${this._options.topic}/connected`,
        retain: true,
        payload: 0
      }
    }
  }

  _getTopic (suffix) {
    return `${this._options.topic}/status/${suffix}`
  }

  _publishUsage (data) {
    data.val = data.currentUsage
    delete data.currentUsage
    data.tc = Date.now()
    this._mqtt.publish(this._getTopic('usage'), JSON.stringify(data), { qos: 0, retain: false })
  }

  _publishData (data) {
    if (this._options.publishDistinct === true) {
      const distinctVal = { ts: Date.now() }
      this._options.distinctFields.array.forEach(element => {
        if (data[element]) {
          distinctVal.val = data[element]
          this._mqtt.publish(this._getTopic(element), distinctVal)
        }
      })
    } else {
      this._sendToMqtt('energy', data)
    }
  }

  _sendToMqtt (topicSuffix, data) {
    this._mqtt.publish(this._getTopic(topicSuffix), JSON.stringify(data), { qos: 0, retain: true })
  }

  static get DefaultOptions () {
    return {
      topic: 'smartmeter',
      publishDistinct: false,
      distinctFields: ['currentTarrif', 'totalT1Use', 'totalT2Use', 'totalT1Delivered', 'totalT2Delivered', 'powerSn', 'currentUsage', 'currentDelivery'],
      url: 'mqtt://localhost:1883'
    }
  }
}

module.exports = MqttOutput
