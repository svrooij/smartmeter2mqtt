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
  }

  start () {
    if (config['port'] && config['port'].length > 0) {
      console.log('- Read serial port %s', config.port)
      this._reader.startWithSerialPort(config.port)
    } else if (config['socket'] && config['socket'].length > 0) {
      const parts = config['socket'].toString().split(':')
      if (parts.length !== 2) {
        console.warn('Socket incorrect format \'host:port\'')
        process.exit(3)
      }
      console.log('- Read from socket %s', config['socket'])
      this._reader.startWithSocket(parts[0], parseInt(parts[1]))
    } else {
      console.warn('Port or socket required')
      process.exit(2)
    }
    if (config['web-server'] > 0) this._startWebServer(config['web-server'])
    if (config['tcp-server'] > 0) this._startTcpServer()
    if (config['raw-tcp-server'] > 0) this._startRawTcpServer()

    if (config.debug) this.debug()
  }

  _startTcpServer () {
    this._reader.startParsing(true)
    console.log('- Output: JSON TCP socket on port %d', config['tcp-server'])
    const TcpServer = require('./lib/output/tcp-server')
    this._tcpServer = new TcpServer(config['tcp-server'])
    this._reader.on('dsmr', data => {
      this._tcpServer.write(`${JSON.stringify(data)}\n`)
    })
  }

  _startRawTcpServer () {
    console.log('- Output: RAW TCP socket on port %d', config['raw-tcp-server'])
    const TcpServer = require('./lib/output/tcp-server')
    this._rawTcpServer = new TcpServer(config['raw-tcp-server'])
    this._reader.on('line', line => {
      this._rawTcpServer.write(`${line}\r\n`)
    })
  }

  _startWebServer (port) {
    this._reader.startParsing(true)
    console.log('- Output: Webserver on port %d', port)
    const WebServer = require('./lib/output/web-server')
    this._webserver = new WebServer(port)
    this._reader.on('dsmr', data => {
      this._webserver.setReading(data)
    })
  }

  debug () {
    console.log('- Output: debug')
    this._reader.startParsing(true)
    this._reader.on('dsmr', result => {
      console.log(' - new reading %s', JSON.stringify(result, null, 2))
    })
    this._reader.on('usageChange', result => {
      console.log(' - usageChange %s', result.message)
    })
    this._reader.on('errorMessage', message => {
      console.log(' - errorMessage %s', message)
    })
  }

  stop () {
    if (this._tcpServer) this._tcpServer.close()
    if (this._rawTcpServer) this._rawTcpServer.close()
    if (this._webserver) this._webserver.close()
    this._reader.close(() => {
      process.exit()
    })
  }
}

const smartmeter = new Smartmeter()
smartmeter.start()

process.on('SIGINT', () => {
  smartmeter.stop()
})
