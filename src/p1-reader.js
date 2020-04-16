const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const Socket = require('net').Socket
const EventEmitter = require('events')
const P1Parser = require('./p1-parser')
const P1ReaderEvents = require('./p1-reader-events')

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
      this.emit(P1ReaderEvents.Line, line)
      if (P1Parser.isStart(line)) this.emit(P1ReaderEvents.Line, '')
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
        this.emit(P1ReaderEvents.Line, line)
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
    this.on(P1ReaderEvents.Line, line => { this._parseLine(line.trim()) })
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
    this.emit(P1ReaderEvents.Raw, this._lastMessage)
    const result = this._parser.result()
    if (this._crcCheck && !result.crc) {
      this.emit(P1ReaderEvents.ErrorMessage, 'CRC failed')
      return
    }
    result.calculatedUsage = Math.round(((result.currentUsage || 0.0) - (result.currentDelivery || 0.0)) * 1000)
    this._lastResult = result
    this.emit(P1ReaderEvents.ParsedResult, this._lastResult)

    if (this._usage !== result.calculatedUsage) {
      const relative = (result.calculatedUsage - this._usage)
      this.emit(P1ReaderEvents.UsageChanged, {
        previousUsage: this._usage,
        currentUsage: result.calculatedUsage,
        relative: relative,
        message: `Usage ${(relative > 0 ? 'increased +' : 'decreased ')}${relative} to ${result.calculatedUsage}`
      })
      this._usage = result.calculatedUsage
    }
  }

  close () {
    return new Promise((resolve, reject) => {
      this._reading = false
      if (this._port) {
        this._port.close(resolve)
      } else {
        resolve()
      }
    }).then(() => {
      console.log(' - Reader closed')
    })
  }
}

module.exports = P1Reader
