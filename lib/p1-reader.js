const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')

const EventEmitter = require('events')
const P1Parser = require('./p1-parser')

class P1Reader extends EventEmitter {
  constructor (path, baudRate) {
    super()
    this._port = new SerialPort(path, { baudRate: baudRate })
    this._serialParser = new Readline()
    this._port.pipe(this._serialParser)
  }

  outputLines () {
    this._serialParser.on('data', line => this.emit('line', line))
  }

  startParsing (crcCheck = false) {
    this._crcCheck = crcCheck
    this._parser = new P1Parser(crcCheck)
    this._serialParser.on('data', line => {
      if (P1Parser.isStart(line)) this._parser = new P1Parser(this._crcCheck)
      if (!P1Parser.isEnd(line)) {
        this._parser.addLine(line)
      } else {
        if (crcCheck) {
          // Check the CRC
        }
        this.emit('dsmr', this._parser.result)
      }
    })
  }

  close (cb) {
    this._port.close(cb)
  }
}

module.exports = P1Reader
