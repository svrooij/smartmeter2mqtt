import SerialPort from 'serialport';
import { Socket } from 'net';
import { EventEmitter } from 'events';
import P1Parser from './p1-parser';
import P1ReaderEvents from './p1-reader-events';
import DsmrMessage from './dsmr-message';
import SolarInput from './solar-input';
import GasValue from './gas-value';

export default class P1Reader extends EventEmitter {
  private usage: number;

  private gasUsage: number;

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
  private solarInput?: SolarInput;

  constructor() {
    super();
    this.usage = 0;
    this.gasUsage = 0;
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

  public addSolarInput(input: SolarInput): void {
    this.solarInput = input;
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
    const solar = this.solarInput ? await this.solarInput.getSolarData() : undefined;
    if (solar) {
      result.calculatedUsage = Math.round(((result.currentUsage || 0.0) - (result.currentDelivery || 0.0)) * 1000);
      result.solarProduction = await this.solarInput?.getCurrentProduction();
      result.houseUsage = Math.round((result.solarProduction ?? 0) + result.calculatedUsage);
      this.emit(P1ReaderEvents.SolarResult, solar);
    } else {
      result.calculatedUsage = Math.round(((result.currentUsage || 0.0) - (result.currentDelivery || 0.0)) * 1000);
    }

    this.lastResult = result;
    this.emit(P1ReaderEvents.ParsedResult, this.lastResult);

    const newUsage = (result.houseUsage ?? result.calculatedUsage);
    if (this.usage !== newUsage) {
      const relative = (newUsage - this.usage);
      this.emit(P1ReaderEvents.UsageChanged, {
        previousUsage: this.usage,
        currentUsage: newUsage,
        relative,
        message: `Usage ${(relative > 0 ? 'increased +' : 'decreased ')}${relative} to ${newUsage}`,
      });
      this.usage = newUsage;
    }

    /**
     * Handle the gas value
     */
    const gas = result.xGas ?? result.gas;
    if (gas) {
      const newGasUsage = ((gas as GasValue).totalUse ?? 0);
      if (this.gasUsage !== newGasUsage && this.gasUsage) {
        const relative = (newGasUsage - this.gasUsage);
        this.emit(P1ReaderEvents.GasUsageChanged, {
          previousUsage: this.gasUsage,
          currentUsage: newGasUsage,
          relative,
          message: `Usage increased +${relative} to ${newGasUsage}`,
        });
      }
      this.gasUsage = newGasUsage;
    }
  }

  public close(): Promise<void> {
    if (this.solarInput) {
      this.solarInput = undefined;
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
