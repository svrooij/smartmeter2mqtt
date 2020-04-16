import http, { Server } from 'http';
import WebSocket from 'ws';
import path from 'path';
import { Output } from './output';
import P1ReaderEvents from '../p1-reader-events';
import P1Reader from '../p1-reader';
import DsmrMessage from '../dsmr-message';

import express = require('express');

export class WebServer extends Output {
  private server?: Server;

  private wsServer?: WebSocket.Server;

  private lastReading?: DsmrMessage;

  private checkTimeout?: NodeJS.Timeout;

  constructor(private readonly port: number, private readonly startServer = true) {
    super();
  }

  start(p1Reader: P1Reader) {
    if (p1Reader === undefined) throw new Error('p1Reader is undefined!');

    p1Reader.on(P1ReaderEvents.ParsedResult, (data) => {
      this._setReading(data);
    });
    if (this.startServer === false) {
      this._start();
    }
  }

  _start(startSockets = true) {
    const app = express();

    this.server = http.createServer(app);
    if (startSockets) {
      this.wsServer = new WebSocket.Server({ server: this.server });
      this.wsServer.on('connection', (ws) => {
        // ws.isAlive = true
        // ws.on('pong', () => {
        //   ws.isAlive = true
        // })
        if (this.lastReading) {
          ws.send(JSON.stringify(this.lastReading));
        } else {
          ws.send('{"err":"No reading just yet"}');
        }
      });
    }
    app.get('/api/reading', (req, res) => this._getReading(req, res));
    app.use(express.static(path.join(__dirname, 'wwwroot'), { index: 'index.html' }));
    this.server.listen(this.port);
    this.checkTimeout = setInterval(() => { this._checkSockets(); }, 10000);
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.checkTimeout) clearInterval(this.checkTimeout);
      this.server?.close(() => {
        resolve();
      });
    });
  }

  _getReading(req: any, res: any): void {
    if (this.lastReading) {
      res.json(this.lastReading);
    } else {
      res.status(400).json({ err: 'No reading just yet!' });
    }
  }

  _setReading(newReading: DsmrMessage) {
    this.lastReading = newReading;
    this._broadcastMessage(newReading);
  }

  _checkSockets(): void {
    // this._sockets.clients.forEach(client => {
    //   if (!client.isAlive) return client.terminate()
    //   client.isAlive = false
    //   client.ping(null, false, true)
    // })
  }

  _broadcastMessage(msg: DsmrMessage) {
    if (this.wsServer) {
      const readingString = JSON.stringify(msg);
      this.wsServer.clients.forEach((client) => {
        client.send(readingString);
      });
    }
  }
}

module.exports = WebServer;
