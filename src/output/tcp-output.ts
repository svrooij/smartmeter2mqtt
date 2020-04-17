import { TcpServer } from '@svrooij/tcp-server';
import Output from './output';
import P1ReaderEvents from '../p1-reader-events';
import P1Reader from '../p1-reader';

export default class TcpOutput extends Output {
  private server?: TcpServer;

  constructor(private port: number, private raw = false, private startServer = true) {
    super();
  }

  start(p1Reader: P1Reader): void {
    if (p1Reader === undefined) {
      throw new Error('p1Reader is undefined!');
    }

    this.server = new TcpServer({ port: this.port, host: '0.0.0.0', maxConnections: 3 });
    if (this.raw) {
      p1Reader.on(P1ReaderEvents.Line, (line) => {
        this.server?.publish(`${line}\r\n`);
      });
    } else {
      p1Reader.on(P1ReaderEvents.ParsedResult, (data) => {
        this.server?.publishAsJson(data, '\n');
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

  close(): Promise<void> {
    this.server?.stop();
    return Promise.resolve();
  }
}
