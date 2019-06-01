const net = require('net')
const Output = require('./output')
const P1ReaderEvents = require('../p1-reader-events')
class TcpServer extends Output {
  constructor () {
    super()
    this.port = 3500
    this.ip = '0.0.0.0'
    this._sockets = []
    this._server = net.createServer(socket => {
      if (this._sockets.length >= 3) {
        socket.write('Too many connections')
        socket.end()
        return
      }
      console.log(`Output: Socket, new connection from ${socket.remoteAddress}`)
      // Add to all sockets
      this._sockets.push(socket)
      socket.setEncoding('ascii')
      // Register events
      socket.on('close', () => {
        // console.debug(`Close event from ${socket.remoteAddress} ${socket.remotePort}`)
        let index = this._sockets.findIndex(function (o) {
          return o.remoteAddress === socket.remoteAddress && o.remotePort === socket.remotePort
        })
        if (index !== -1) this._sockets.splice(index, 1)
        socket.destroy()
      })
      socket.on('data', (data) => {
        // console.log('data buffer %s %j', data, data.toString().charCodeAt(0))

        if (data.toString().charCodeAt(0) === 127 || data.toString().startsWith('exit')) {
          console.log(`Output: Socket, got Ctrl+C from ${socket.remoteAddress} ${socket.remotePort}`)
          socket.end()
        }
      })
    })
  }

  start (p1Reader, options = {}) {
    if (p1Reader === undefined) throw new Error('p1Reader is undefined!')
    if (typeof (options.port) === 'number') this.port = options.port
    if (options.ip) this.ip = options.ip
    if (options.rawSocket) {
      p1Reader.on(P1ReaderEvents.Line, line => {
        this._write(`${line}\r\n`)
      })
    } else {
      p1Reader.on(P1ReaderEvents.ParsedResult, data => {
        this._write(`${JSON.stringify(data)}\n`)
      })
    }
    if (options.startServer !== false) {
      this._server.listen(this.port, this.ip)
    }
  }

  _write (data) {
    this._sockets.forEach((socket) => {
      socket.write(data)
    })
  }

  close () {
    return new Promise((resolve, reject) => {
      this._sockets.forEach((socket) => {
        socket.end()
      })
      this._server.close(resolve)
    })
  }
}

module.exports = TcpServer
