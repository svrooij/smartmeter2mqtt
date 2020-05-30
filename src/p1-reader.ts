import SerialPort from 'serialport';
import { Socket } from 'net';
import { EventEmitter } from 'events';
import { SunspecReader } from '@svrooij/sunspec';
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

  // Inverter stuff
  private sunspecReader?: SunspecReader;

  constructor() {
    super();
    this.usage = 0;
    this.reading = false;
    this.parsing = false;
  }

  public startWithSerialPort(path: string, baudRate = 115200): void {
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

  public startWithSocket(host: string, port: number): void {
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

  public startParsing(): void {
    if (this.parsing) return;
    this.parser = new P1Parser();
    this.on(P1ReaderEvents.Line, (line) => { this.parseLine(line.trim()); });
    this.parsing = true;
  }

  public async enableSubspec(host: string, port: number): Promise<void> {
    this.sunspecReader = new SunspecReader(host, port);
    this.sunspecReader.readInverterInfo();
  }

  private parseLine(line: string): void {
    if (P1Parser.isStart(line)) {
      this.parser = new P1Parser();
      this.parser.addLine(line);
    } else if (this.parser && this.parser.addLine(line)) {
      this.handleEnd();
    }
  }

  private async handleEnd(): Promise<void> {
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
    const solar = this.sunspecReader ? await this.sunspecReader.readData() : undefined;
    if (solar) {
      result.calculatedUsage = Math.round(((result.currentUsage || 0.0) - (result.currentDelivery || 0.0)) * 1000);
      result.solarProduction = solar.acPower;
      result.houseUsage = Math.round((solar.acPower ?? 0) + result.calculatedUsage);
      this.emit(P1ReaderEvents.SolarResult, solar);
    } else {
      result.calculatedUsage = Math.round(((result.currentUsage || 0.0) - (result.currentDelivery || 0.0)) * 1000);
    }

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

  public close(): Promise<void> {
    if (this.sunspecReader) {
      this.sunspecReader = undefined;
    }
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
