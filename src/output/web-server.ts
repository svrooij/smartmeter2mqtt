import http, { Server } from 'http';
import WebSocket from 'ws';
import path from 'path';
import Output from './output';
import P1ReaderEvents from '../p1-reader-events';
import P1Reader from '../p1-reader';
import DsmrMessage from '../dsmr-message';

import express = require('express');

export default class WebServer extends Output {
  private server?: Server;

  private wsServer?: WebSocket.Server;

  private lastReading?: DsmrMessage;

  private checkTimeout?: NodeJS.Timeout;

  constructor(private readonly port: number, private readonly startServer = true) {
    super();
  }

  start(p1Reader: P1Reader): void {
    if (p1Reader === undefined) throw new Error('p1Reader is undefined!');

    p1Reader.on(P1ReaderEvents.ParsedResult, (data) => {
      this.setReading(data);
    });
    if (this.startServer === true) {
      this.startWebserver();
    }
  }

  private startWebserver(startSockets = true): void {
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
    app.get('/api/reading', (req, res) => this.getReading(req, res));
    app.use(express.static(path.join(__dirname, 'wwwroot'), { index: 'index.html' }));
    this.server.listen(this.port);
    this.checkTimeout = setInterval(() => { this.checkSockets(); }, 10000);
  }

  close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.checkTimeout) clearInterval(this.checkTimeout);
      this.server?.close(() => {
        resolve();
      });
    });
  }

  private getReading(req: any, res: any): void {
    if (this.lastReading) {
      res.json(this.lastReading);
    } else {
      res.status(400).json({ err: 'No reading just yet!' });
    }
  }

  private setReading(newReading: DsmrMessage): void {
    this.lastReading = newReading;
    this.broadcastMessage(newReading);
  }

  private checkSockets(): void {
    // this._sockets.clients.forEach(client => {
    //   if (!client.isAlive) return client.terminate()
    //   client.isAlive = false
    //   client.ping(null, false, true)
    // })
  }

  private broadcastMessage(msg: DsmrMessage): void {
    if (this.wsServer) {
      const readingString = JSON.stringify(msg);
      this.wsServer.clients.forEach((client) => {
        client.send(readingString);
      });
    }
  }
}
