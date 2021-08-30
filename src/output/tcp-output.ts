import { TcpServer } from '@svrooij/tcp-server';
import { Output } from './output';
import P1Reader from '../p1-reader';
import BaseSolarReader from '../solar/base-solar-input';

export default class TcpOutput implements Output {
  private server?: TcpServer;

  constructor(private port: number, private socketType: 'tcp' | 'mqtt' | 'raw', private startServer = true) {
  }

  start(p1Reader: P1Reader): void {
    if (p1Reader === undefined) {
      throw new Error('p1Reader is undefined!');
    }

    this.server = new TcpServer({ port: this.port, host: '0.0.0.0', maxConnections: 3 });
    if (this.socketType === 'raw') {
      p1Reader.on('line', (line) => {
        this.server?.publish(`${line}\r\n`);
      });
    } else {
      p1Reader.on('dsmr', (data) => {
        const niceData = this.socketType === 'mqtt' ? { topic: 'power', payload: data } : data;
        this.server?.publishAsJson(niceData, '\r\n');
      });
    }

    if (this.startServer === true) {
      this.server?.start();
      this.server?.on('onDisconnect', (address) => {
        console.log(`Output: Socket, connection ${address} closed`);
      });
      this.server?.on('onConnect', (socket) => {
        console.log(`Output: Socket, new connection from ${socket.remoteAddress}`);
      });
    }
  }

  addSolar(solarReader: BaseSolarReader): void {
    if (this.socketType === 'mqtt') {
      solarReader.on('solar', (data) => {
        this.server?.publishAsJson({ topic: 'solar', payload: data }, '\r\n');
      });
    }
  }

  close(): Promise<void> {
    this.server?.stop();
    return Promise.resolve();
  }
}
