const Express = require('express')
const path = require('path')

class WebServer {
  constructor (port) {
    this._port = port
    this._start()
  }

  _start () {
    this._app = new Express()
    this._app.get('/api/reading', (req, res) => this._getReading(req, res))
    this._app.use(Express.static(path.join(__dirname, 'wwwroot'), { index: 'index.html' }))
    this._app.listen(this._port)
  }

  close () {
    this._app.close()
  }

  _getReading (req, res) {
    if (this._reading) res.json(this._reading)
    else res.status(400).json({ err: 'No reading just yet!' })
  }

  setReading (newReading) {
    this._reading = newReading
  }
}

module.exports = WebServer
