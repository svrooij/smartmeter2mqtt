const net = require('net')
class TcpServer {
  constructor (port, ip = '0.0.0.0') {
    this._sockets = []
    this._server = net.createServer(socket => {
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
          console.log(`Got Ctrl+C from ${socket.remoteAddress} ${socket.remotePort}`)
          socket.end()
        }
      })
    })
    this._server.listen(port, ip)
  }

  write (data) {
    this._sockets.forEach((socket) => {
      socket.write(data)
    })
  }

  close (cb) {
    this._sockets.forEach((socket) => {
      socket.destroy()
    })
    this._server.close(cb)
  }
}

module.exports = TcpServer
