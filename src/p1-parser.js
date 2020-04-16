const P1Map = require('./p1-map')
const crc16 = require('crc/lib/crc16')
class P1Parser {
  constructor () {
    this._message = ''
    this._data = {}
  }

  addLine (line) {
    const isEnd = P1Parser.isEnd(line)
    if (line.length > 0) {
      if (!isEnd) this._message += `${line}\r\n`
      if (P1Parser.isStart(line)) {
        this._data.header = line.substr(1)
        this._message += '\r\n'
      } else if (isEnd) {
        // Always to crc check, it can fail, we still want te result.
        const calculatedCrc = crc16(this._message + '!').toString(16).toUpperCase()
        // console.log('Calculated CRC %s line: %s', calculatedCrc, line)
        this._data.crc = calculatedCrc === line.substr(1)

        this._message += `${line}\r\n`
        return true
      } else {
        const parsed = P1Parser.parseLine(line)
        if (parsed && parsed.name) {
          this._data[parsed.name] = parsed.value || parsed.raw
        }
      }
    }
    return false
  }

  checkCrc (line) {
    return false
  }

  result () {
    return this._data
  }

  originalMessage () {
    return this._message
  }

  static isStart (line) {
    return line.length > 0 && line.startsWith('/')
  }

  static isEnd (line) {
    return line.length > 0 && line.startsWith('!')
  }

  static parseLine (line) {
    if (line && line.length > 0) {
      const identifier = line.substr(0, line.indexOf('('))
      const values = P1Parser.stringsInBrackets(line)
      const result = { id: identifier, raw: values }
      const property = P1Map.find(m => {
        return m.id === identifier
      })
      if (property) {
        result.name = property.name
        if (property.valueRetriever) {
          result.value = property.valueRetriever(values)
          delete result.raw
        }
      }
      return result
    }
  }

  static stringsInBrackets (line) {
    var matches = line.match(/\((.*?)\)/g)
    if (matches) {
      return matches.map(value => { return value.replace(/[()]/g, '') })
    }
    return null
  }
}

module.exports = P1Parser
