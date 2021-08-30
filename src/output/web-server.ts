import http, { Server } from 'http';
import WebSocket from 'ws';
import path from 'path';
import { SunspecResult } from '@svrooij/sunspec/lib/sunspec-result';
import { Output } from './output';
import P1Reader, { Usage } from '../p1-reader';
import DsmrMessage from '../dsmr-message';
import BaseSolarReader from '../solar/base-solar-input';

import express = require('express');


export default class WebServer implements Output {
  private server?: Server;

  private wsServer?: WebSocket.Server;

  private lastReading?: DsmrMessage;

  private lastSolarReading?: Partial<SunspecResult>;

  private checkTimeout?: NodeJS.Timeout;

  constructor(private readonly port: number, private readonly startServer = true) {

  }

  start(p1Reader: P1Reader): void {
    if (p1Reader === undefined) throw new Error('p1Reader is undefined!');

    p1Reader.on('dsmr', (data) => {
      this.setReading(data);
    });

    // p1Reader.on('solar', (data) => {
    //   this.lastSolarReading = data;
    // });

    if (this.startServer === true) {
      this.startWebserver();
    }
  }

  addSolar(solarReader: BaseSolarReader): void {
    solarReader.on('solar', (data) => {
      this.setSolar(data);
    });
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
          ws.send(JSON.stringify({ topic: 'power', payload: this.lastReading }));
        } else {
          ws.send('{"err":"No reading just yet"}');
        }
      });
    }
    app.get('/api/reading', (req, res) => this.getReading(req, res));
    app.get('/api/solar', (req, res) => this.getSolarReading(req, res));
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

  private getSolarReading(req: any, res: any): void {
    if (this.lastSolarReading) {
      res.json(this.lastSolarReading);
    } else {
      res.status(400).json({ err: 'No reading just yet!' });
    }
  }

  private setReading(newReading: DsmrMessage): void {
    this.lastReading = newReading;
    this.broadcastMessage('dsmr', newReading);
  }

  private setSolar(data: Partial<SunspecResult>): void {
    this.lastSolarReading = data;
    this.broadcastMessage('solar', data);
  }

  private checkSockets(): void {
    // this._sockets.clients.forEach(client => {
    //   if (!client.isAlive) return client.terminate()
    //   client.isAlive = false
    //   client.ping(null, false, true)
    // })
  }

  private broadcastMessage(topic: 'dsmr' | 'usage' | 'solar', data: DsmrMessage | Partial<SunspecResult> | Usage): void {
    if (this.wsServer) {
      const msg = {
        topic,
        payload: data,
      };
      const readingString = JSON.stringify(msg);
      this.wsServer.clients.forEach((client) => {
        client.send(readingString);
      });
    }
  }
}
