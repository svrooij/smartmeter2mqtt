import SerialPort from 'serialport';
import { Socket } from 'net';
import { EventEmitter } from 'events';
import P1Parser from './p1-parser';
import P1ReaderEvents from './p1-reader-events';
import DsmrMessage from './dsmr-message';

export default class P1Reader extends EventEmitter {
  private usage: number;

  private reading: boolean;

  private parsing: boolean;

  private lastResult?: DsmrMessage;

  // Serial port stuff
  private serialPort?: SerialPort;

  private serialParser?: SerialPort.parsers.Readline;

  // TCP Socket stuff
  private socket?: Socket;

  private parser?: P1Parser;

  constructor() {
    super();
    this.usage = 0;
    this.reading = false;
    this.parsing = false;
  }

  startWithSerialPort(path: string, baudRate = 115200): void {
    if (this.reading) throw new Error('Already reading');
    this.serialPort = new SerialPort(path, { baudRate });
    this.serialParser = new SerialPort.parsers.Readline({ delimiter: '\r\n' });
    this.serialPort.pipe(this.serialParser);
    this.serialParser.on('data', (line) => {
      this.emit(P1ReaderEvents.Line, line);
      if (P1Parser.isStart(line)) this.emit(P1ReaderEvents.Line, '');
    });
    this.reading = true;
  }

  startWithSocket(host: string, port: number): void {
    this.socket = new Socket();
    this.socket.connect(port, host);
    this.socket.setEncoding('ascii');
    this.socket.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach((line) => {
        this.emit(P1ReaderEvents.Line, line);
      });
    });

    this.socket.on('close', () => {
      console.warn('Socket connection closed');
      process.exit(10);
    });
  }

  startParsing(): void {
    if (this.parsing) return;
    this.parser = new P1Parser();
    this.on(P1ReaderEvents.Line, (line) => { this.parseLine(line.trim()); });
    this.parsing = true;
  }

  parseLine(line: string): void {
    if (P1Parser.isStart(line)) {
      this.parser = new P1Parser();
      this.parser.addLine(line);
    } else if (this.parser && this.parser.addLine(line)) {
      this.handleEnd();
    }
  }

  handleEnd(): void {
    if (this.parser === undefined) {
      throw new Error('Parser not running');
    }
    // this._lastMessage = this._parser.originalMessage()
    const originalMessage = this.parser.message;
    this.emit(P1ReaderEvents.Raw, originalMessage);
    const result = this.parser.data;
    if (!result.crc) {
      this.emit(P1ReaderEvents.ErrorMessage, 'CRC failed');
      return;
    }
    result.calculatedUsage = Math.round(((result.currentUsage || 0.0) - (result.currentDelivery || 0.0)) * 1000);
    this.lastResult = result;
    this.emit(P1ReaderEvents.ParsedResult, this.lastResult);

    if (this.usage !== result.calculatedUsage) {
      const relative = (result.calculatedUsage - this.usage);
      this.emit(P1ReaderEvents.UsageChanged, {
        previousUsage: this.usage,
        currentUsage: result.calculatedUsage,
        relative,
        message: `Usage ${(relative > 0 ? 'increased +' : 'decreased ')}${relative} to ${result.calculatedUsage}`,
      });
      this.usage = result.calculatedUsage;
    }
  }

  close(): Promise<void> {
    return new Promise((resolve) => {
      this.reading = false;
      if (this.serialPort) {
        this.serialPort.close(resolve);
      } else if (this.socket) {
        this.socket.destroy();
        resolve();
      } else {
        resolve();
      }
    }).then(() => {
      console.log(' - Reader closed');
    });
  }
}
