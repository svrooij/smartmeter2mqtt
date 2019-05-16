const P1Map = require('./p1-map')
class P1Parser {
  constructor (crcCheck = false) {
    this._message = ''
    this._data = {}
    this._crcCheck = crcCheck
  }
  addLine (line) {
    this._message += `${line}\r\n`
    if (line.length > 0) {
      if (P1Parser.isStart(line)) {
        this._data.header = line.substr(1)
      } else if (P1Parser.isEnd(line)) {
        // Do something when last line is inserted
        if (this._crcCheck) {
          console.log('Should do CRC here')
          this._data.crc = true
        }
        return true
      } else {
        const parsed = P1Parser.parseLine(line)
        // console.log('Parsed line = %s', JSON.stringify(parsed))
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
      let result = { id: identifier, raw: values }
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
