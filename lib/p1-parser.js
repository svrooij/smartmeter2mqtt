class P1Parser {
  constructor () {
    this._message = ''
    this._data = {}
  }
  addLine (line) {
    this._message += `${line}\n`
    if (line.length > 0) {
      if (P1Parser.isStart(line)) this._data.header = line.substr(1)
    }
  }

  checkCrc (line) {
    return false
  }

  get result () {
    return this._data
  }

  static isStart (line) {
    return line.length > 0 && line.startsWith('/')
  }

  static isEnd (line) {
    return line.length > 0 && line.startsWith('!')
  }
}

module.exports = P1Parser
