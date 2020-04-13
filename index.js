#!/usr/bin/env node

const P1Reader = require('./lib/p1-reader')
const config = require('./lib/config')

class Smartmeter {
  constructor () {
    this._reader = new P1Reader()
    console.clear()
    console.log('----------------------------------------')
    console.log('- Smartmeter2mqtt by Stephan van Rooij -')
    console.log('- Press CTRL+C to close                -')
    console.log('----------------------------------------')
    this.outputs = []
  }

  start () {
    if (config.port && config.port.length > 0) {
      console.log('- Read serial port %s', config.port)
      this._reader.startWithSerialPort(config.port)
    } else if (config.socket && config.socket.length > 0) {
      const parts = config.socket.toString().split(':')
      if (parts.length !== 2) {
        console.warn('Socket incorrect format \'host:port\'')
        process.exit(3)
      }
      console.log('- Read from socket %s', config.socket)
      this._reader.startWithSocket(parts[0], parseInt(parts[1]))
    } else {
      console.warn('Port or socket required')
      process.exit(2)
    }
    this._startOutputs()
  }

  async stop () {
    await Promise.all(this.outputs.map(output => output.close())).catch(err => {
      console.warn(err)
    })
    await this._reader.close()
    process.exit()
  }

  _startOutputs () {
    if (config['web-server'] > 0) this._startWebServer(config['web-server'])
    if (config['tcp-server'] > 0) {
      this._reader.startParsing(true)
      this._startTcpServer(config['tcp-server'])
    }

    if (config['mqtt-url']) {
      this._startMqtt({
        url: config['mqtt-url'],
        topic: config['mqtt-topic'],
        discovery: config['mqtt-discovery'] === true,
        discoveryPrefix: config['mqtt-discovery-prefix'],
        publishDistinct: config['mqtt-distinct'] === true
      })
    }

    if (config['post-url']) this._startHttp({ url: config['post-url'], interval: config['post-interval'], postJson: config['post-json'] === true })

    if (config['raw-tcp-server'] > 0) this._startTcpServer(config['raw-tcp-server'], true)

    if (config.debug) this.debug()

    if (this.outputs.length === 0) {
      console.warn('No outputs enabled, you should enable at least one.')
      process.exit(5)
    }
  }

  _startTcpServer (port, raw = false) {
    console.log(`- Output: ${raw ? 'Raw' : 'JSON'} TCP socket on port ${port}`)
    const TcpServer = require('./lib/output/tcp-server')
    const tcpServer = new TcpServer()
    tcpServer.start(this._reader, { port, rawSocket: raw === true })
    this.outputs.push(tcpServer)
  }

  _startWebServer (port) {
    this._reader.startParsing(true)
    console.log('- Output: Webserver on port %d', port)
    const WebServer = require('./lib/output/web-server')
    const webserver = new WebServer()
    webserver.start(this._reader, { port: port })
    this.outputs.push(webserver)
  }

  _startHttp (options = {}) {
    this._reader.startParsing(true)
    console.log('- Output: Post data to %s every %d sec.', options.url, options.interval)
    const HttpOutput = require('./lib/output/http-output')
    const httpOutput = new HttpOutput()
    httpOutput.start(this._reader, options)
    this.outputs.push(httpOutput)
  }

  _startMqtt (options = {}) {
    this._reader.startParsing(true)
    console.log('- Output: Mqtt to %s', options.url)
    const MqttOutput = require('./lib/output/mqtt-output')
    const mqttOutput = new MqttOutput()
    mqttOutput.start(this._reader, options)
    this.outputs.push(mqttOutput)
  }

  debug () {
    console.log('- Output: debug')
    this._reader.startParsing(true)

    const DebugOutput = require('./lib/output/debug-output')
    const debugOutput = new DebugOutput()
    debugOutput.start(this._reader)
    this.outputs.push(debugOutput)
  }
}

const smartmeter = new Smartmeter()
smartmeter.start()

process.on('SIGINT', () => {
  console.log('Exiting....')
  smartmeter.stop()
})
