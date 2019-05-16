const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')

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
    this._serialParser.on('data', line => this.emit('line', line))
    this._reading = true
  }

  startParsing (crcCheck = false) {
    if (this._parsing) return
    this._crcCheck = crcCheck
    this._parser = new P1Parser(crcCheck)
    this.on('line', line => { this._parseLine(line) })
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
    this._lastResult = this._parser.result()
    this.emit('dsmr', this._lastResult)
    this.emit('raw', this._lastMessage)
    const actualUsage = Math.round(((this._lastResult.currentUsage || 0.0) - (this._lastResult.currentDelivery || 0.0)) * 1000)
    if (this._usage !== actualUsage) {
      const relative = (actualUsage - this._usage)
      this.emit('usageChange', {
        previousUsage: this._usage,
        currentUsage: actualUsage,
        relative: relative,
        message: `Usage ${(relative > 0 ? 'increased +' : 'decreased ')}${relative} to ${actualUsage}`
      })
      this._usage = actualUsage
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
