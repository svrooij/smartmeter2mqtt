const Output = require('./output')
const P1ReaderEvents = require('../p1-reader-events')
const Mqtt = require('mqtt')

class MqttOutput extends Output {
  constructor () {
    super()
    this._mqtt = null
    this._options = {}
    this._discoverySend = false
  }

  start (p1Reader, options = {}) {
    this._options = Object.assign(MqttOutput.DefaultOptions, options)
    this._mqtt = Mqtt.connect(this._options.url)
    this._mqtt.on('connect', () => {
      this._mqtt.publish(`${this._options.topic}/connected`, '2', { qos: 0, retain: true })
    })
    p1Reader.on(P1ReaderEvents.ParsedResult, data => {
      this._publishData(data)
      if (this._options.discovery && !this._discoverySend) {
        this._publishAutoDiscovery(data)
        this._discoverySend = true
      }
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

  _publishAutoDiscovery (data) {
    // Current usage
    const device = {
      // json_attributes: true,
      device_class: 'power',
      // schema: 'json',
      // json_attributes_topic: `${this._options.topic}/status/enegry`,
      state_topic: `${this._options.topic}/status/energy`,
      availability_topic: `${this._options.topic}/connected`,
      payload_available: '2',
      name: 'Current power usage',
      icon: 'mdi:speedometer',
      unit_of_measurement: 'Watt',
      value_template: '{{value_json.calculatedUsage}}',
      unique_id: `smartmeter_${data.powerSn}_current-usage`
    }
    this._mqtt.publish(`${this._options.discoveryPrefix}/sensor/smartmeter/power-usage/config`, JSON.stringify(device), { qos: 0, retain: true })

    delete device.icon

    // Total T1
    device.unique_id = `smartmeter_${data.powerSn}_total_t1_used`
    device.unit_of_measurement = 'kWh'
    device.value_template = '{{value_json.totalT1Use}}'
    device.name = 'Total power used T1'
    this._mqtt.publish(`${this._options.discoveryPrefix}/sensor/smartmeter/t1-used/config`, JSON.stringify(device), { qos: 0, retain: true })

    // Total T2
    device.unique_id = `smartmeter_${data.powerSn}_total_t2_used`
    device.unit_of_measurement = 'kWh'
    device.value_template = '{{value_json.totalT2Use}}'
    device.name = 'Total power used T2'
    this._mqtt.publish(`${this._options.discoveryPrefix}/sensor/smartmeter/t2-used/config`, JSON.stringify(device), { qos: 0, retain: true })

    // Total T1 delivered
    device.unique_id = `smartmeter_${data.powerSn}_total_t1_delivered`
    device.unit_of_measurement = 'kWh'
    device.value_template = '{{value_json.totalT1Delivered}}'
    device.name = 'Total power delivered T1'
    this._mqtt.publish(`${this._options.discoveryPrefix}/sensor/smartmeter/t1-delivered/config`, JSON.stringify(device), { qos: 0, retain: true })

    // Total T1 delivered
    device.unique_id = `smartmeter_${data.powerSn}_total_t2_delivered`
    device.unit_of_measurement = 'kWh'
    device.value_template = '{{value_json.totalT2Delivered}}'
    device.name = 'Total power delivered T2'
    this._mqtt.publish(`${this._options.discoveryPrefix}/sensor/smartmeter/t2-delivered/config`, JSON.stringify(device), { qos: 0, retain: true })

    // Total Gas used
    if (data.gasSn) {
      device.unique_id = `smartmeter_${data.gasSn}_total_gas`
      device.unit_of_measurement = 'm³'
      device.value_template = '{{value_json.gas.totalUse}}'
      device.name = 'Total gas usage'
      device.icon = 'mdi:gas-cylinder'
      delete device.device_class
      this._mqtt.publish(`${this._options.discoveryPrefix}/sensor/smartmeter/gas/config`, JSON.stringify(device), { qos: 0, retain: true })
    }
  }

  static get DefaultOptions () {
    return {
      topic: 'smartmeter',
      publishDistinct: false,
      discovery: false,
      discoveryPrefix: 'homeassistant',
      distinctFields: ['currentTarrif', 'totalT1Use', 'totalT2Use', 'totalT1Delivered', 'totalT2Delivered', 'powerSn', 'currentUsage', 'currentDelivery'],
      url: 'mqtt://localhost:1883'
    }
  }
}

module.exports = MqttOutput
