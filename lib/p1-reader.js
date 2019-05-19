const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const Socket = require('net').Socket
const EventEmitter = require('events')
const P1Parser = require('./p1-parser')

class P1Reader extends EventEmitter {
  constructor (path, baudRate) {
    super()
    this._usage = 0
    this._reading = false
  }

  startWithSerialPort (path, baudRate = 115200) {
    if (this._reading) throw new Error('Already reading')
    this._port = new SerialPort(path, { baudRate: baudRate })
    this._serialParser = new Readline({ delimiter: '\r\n' })
    this._port.pipe(this._serialParser)
    this._serialParser.on('data', line => {
      this.emit('line', line)
      if (P1Parser.isStart(line)) this.emit('line', '')
    })
    this._reading = true
  }

  startWithSocket (host, port) {
    this._socket = new Socket()
    this._socket.connect(port, host)
    this._socket.setEncoding('ascii')
    this._socket.on('data', data => {
      const lines = data.toString().trim().split('\n')
      lines.forEach((line) => {
        this.emit('line', line)
      })
    })

    this._socket.on('close', (hasError) => {
      console.warn('Socket connection closed')
      process.exit(10)
    })
  }

  startParsing (crcCheck = false) {
    if (this._parsing) return
    this._crcCheck = crcCheck
    this._parser = new P1Parser(crcCheck)
    this.on('line', line => { this._parseLine(line.trim()) })
    this._parsing = true
  }

  _parseLine (line) {
    var self = this
    if (P1Parser.isStart(line)) {
      this._parser = new P1Parser(this._crcCheck)
      this._parser.addLine(line)
    } else if (this._parser && this._parser.addLine(line)) {
      self._handleEnd()
    }
  }

  _handleEnd () {
    this._lastMessage = this._parser.originalMessage()
    this.emit('raw', this._lastMessage)
    let result = this._parser.result()
    if (this._crcCheck && !result.crc) {
      this.emit('errorMessage', 'CRC failed')
      return
    }
    result.calculatedUsage = Math.round(((result.currentUsage || 0.0) - (result.currentDelivery || 0.0)) * 1000)
    this._lastResult = result
    this.emit('dsmr', this._lastResult)

    if (this._usage !== result.calculatedUsage) {
      const relative = (result.calculatedUsage - this._usage)
      this.emit('usageChange', {
        previousUsage: this._usage,
        currentUsage: result.calculatedUsage,
        relative: relative,
        message: `Usage ${(relative > 0 ? 'increased +' : 'decreased ')}${relative} to ${result.calculatedUsage}`
      })
      this._usage = result.calculatedUsage
    }
  }

  close (cb) {
    this._reading = false
    if (this._port) {
      this._port.close(cb)
    } else {
      cb()
    }
  }
}

module.exports = P1Reader
