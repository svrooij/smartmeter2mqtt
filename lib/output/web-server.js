const Express = require('express')
const http = require('http')
const WebSocket = require('ws')
const path = require('path')
const Output = require('./output')
const P1ReaderEvents = require('../p1-reader-events')

class WebServer extends Output {
  constructor (port) {
    super()
    this._port = 3000
  }

  start (p1Reader, options = {}) {
    if (p1Reader === undefined) throw new Error('p1Reader is undefined!')
    if (options.port && typeof (options.port) === 'number') this._port = options.port

    p1Reader.on(P1ReaderEvents.ParsedResult, data => {
      this._setReading(data)
    })
    if (options.startServer !== false) {
      this._start(options.useSockets)
    }
  }

  _start (startSockets = true) {
    let app = new Express()
    this._server = http.createServer(app)
    if (startSockets) {
      this._sockets = new WebSocket.Server({ server: this._server })
      this._sockets.on('connection', (ws) => {
        ws.isAlive = true
        ws.on('pong', () => {
          ws.isAlive = true
        })
        if (this._reading) {
          ws.send(JSON.stringify(this._reading))
        } else {
          ws.send('{"err":"No reading just yet"}')
        }
      })
    }
    app.get('/api/reading', (req, res) => this._getReading(req, res))
    app.use(Express.static(path.join(__dirname, 'wwwroot'), { index: 'index.html' }))
    this._server.listen(this._port)
    this._checkInterval = setInterval(() => { this._checkSockets() }, 10000)
  }

  close () {
    return new Promise((resolve, reject) => {
      if (this._checkInterval) clearInterval(this._checkInterval)
      this._server.close(resolve)
    })
  }

  _getReading (req, res) {
    if (this._reading) res.json(this._reading)
    else res.status(400).json({ err: 'No reading just yet!' })
  }

  _setReading (newReading) {
    this._reading = newReading
    this._broadcastMessage(newReading)
  }

  _checkSockets () {
    this._sockets.clients.forEach(client => {
      if (!client.isAlive) return client.terminate()
      client.isAlive = false
      client.ping(null, false, true)
    })
  }

  _broadcastMessage (msg) {
    if (this._sockets) {
      let readingString = JSON.stringify(msg)
      this._sockets.clients.forEach(client => {
        if (client.isAlive) {
          client.send(readingString)
        }
      })
    }
  }
}

module.exports = WebServer
