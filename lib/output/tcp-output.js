const Output = require('./output')
const P1ReaderEvents = require('../p1-reader-events')
const TcpServer = require('@svrooij/tcp-server').TcpServer

class TcpOutput extends Output {
  constructor () {
    super()
    this.port = 3500
    this.ip = '0.0.0.0'
  }

  start (p1Reader, options = {}) {
    if (p1Reader === undefined) throw new Error('p1Reader is undefined!')
    if (typeof (options.port) === 'number') this.port = options.port
    if (options.ip) this.ip = options.ip
    this._server = new TcpServer({ port: this.port, host: this.ip, maxConnections: 3 })
    if (options.rawSocket) {
      p1Reader.on(P1ReaderEvents.Line, line => {
        this._server.publish(`${line}\r\n`)
      })
    } else {
      p1Reader.on(P1ReaderEvents.ParsedResult, data => {
        this._server.publishAsJson(data, '\n')
      })
    }
    if (options.startServer !== false) {
      this._server.start()
      this._server.on('onDisconnect', address => {
        console.log(`Output: Socket, connection ${address} closed`)
      })
      this._server.on('onConnect', socket => {
        console.log(`Output: Socket, new connection from ${socket.remoteAddress}`)
      })
    }
  }

  close () {
    this._server.stop()
    return Promise.resolve(true)
  }
}

module.exports = TcpOutput
