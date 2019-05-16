const P1Reader = require('./lib/p1-reader')
const config = require('./lib/config')

class Smartmeter {
  constructor () {
    this._reader = new P1Reader()
    console.log('Smartmeter2mqtt by Stephan van Rooij')
    console.log('Press CTRL+C to close')
  }

  start () {
    this._reader.startWithSerialPort('/dev/ttyUSB0')
    this._reader.startParsing(true)

    if (config['tcp-server'] > 0) this._startTcpServer()

    if (config.debug) this.debug()
  }

  _startTcpServer () {
    console.log('Starting TCP server on port %d', config['tcp-server'])
    const TcpServer = require('./lib/tcp-server')
    this._tcpServer = new TcpServer(config['tcp-server'])
    this._reader.on('line', line => {
      this._tcpServer.write(`${line}\r\n`)
    })
  }

  debug () {
    this._reader.on('dsmr', result => {
      console.log('Parsed message %s', JSON.stringify(result, null, 2))
    })
    this._reader.on('usageChange', result => {
      console.log(result.message)
    })
  }

  stop () {
    if (this._tcpServer) this._tcpServer.close()
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
