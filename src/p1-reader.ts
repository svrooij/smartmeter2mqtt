import SerialPort from 'serialport';
import { Socket } from 'net';
import TypedEmitter from 'typed-emitter';
import { EventEmitter } from 'events';
import { SunspecResult } from '@svrooij/sunspec/lib/sunspec-result';
import P1Parser from './p1-parser';
import DsmrMessage from './dsmr-message';
import SolarInput from './solar-input';
import GasValue from './gas-value';
import { P1Crypt } from './p1-crypt';

export interface Usage {
  previousUsage: number;
  currentUsage: number;
  relative: number;
  message?: string;
}

interface TypedP1ReaderEvents {
  /**
   * Parsed result based if crc checks out
   */
  dsmr: (dsmr: DsmrMessage) => void;

  /** Any errors while reading the stream */
  errorMessage: (message: string) => void;

  /** Relative changes in Gas Usage */
  gasUsage: (usage: Usage) => void;

  /** Read each line as it comes in */
  line: (line: string) => void;

  /** Read the complete raw dsmr message */
  raw: (rawDsmr: string) => void;

  /** Receive solar information */
  solar: (reading: SunspecResult) => void;

  /** Relative changes in electricity usage */
  usage: (usage: Usage) => void;
}

export default class P1Reader extends (EventEmitter as new () => TypedEmitter<TypedP1ReaderEvents>) {
  private usage: number;

  private gasUsage: number;

  private gasReadingTimestamp: number;

  private gasReading: number;

  private reading: boolean;

  private parsing: boolean;

  private lastResult?: DsmrMessage;

  // Serial port stuff
  private serialPort?: SerialPort;

  private serialParser?: SerialPort.parsers.Readline;

  // TCP Socket stuff
  private socket?: Socket;

  private parser?: P1Parser;

  private dataBuffer = '';

  private bufferInterval?: NodeJS.Timeout;

  // Encryption
  private encryption = false;

  private crypt?: P1Crypt;

  // Inverter stuff
  private solarInput?: SolarInput;

  constructor(options?: { key: string; aad: string}) {
    super();
    this.usage = 0;
    this.gasUsage = 0;
    this.gasReading = 0;
    this.gasReadingTimestamp = 0;
    this.reading = false;
    this.parsing = false;

    if (options && options.key) {
      this.encryption = true;
      this.crypt = new P1Crypt(options.key, options.aad);
    }
  }

  public startWithSerialPort(path: string, baudRate = 115200): void {
    if (this.reading) throw new Error('Already reading');
    this.serialPort = new SerialPort(path, { baudRate });
    if (this.encryption) {
      this.serialPort.on('data', (data) => {
        if (this.bufferInterval) {
          clearTimeout(this.bufferInterval);
        }
        this.dataBuffer += data.toString();
        this.bufferInterval = setTimeout(() => {
          this.processBuffer();
        }, 100);
      });
    } else {
      this.serialParser = new SerialPort.parsers.Readline({ delimiter: '\r\n' });
      this.serialPort.pipe(this.serialParser);
      this.serialParser.on('data', (line) => {
        this.emit('line', line);
        if (P1Parser.isStart(line)) this.emit('line', '');
      });
    }
    this.serialParser = new SerialPort.parsers.Readline({ delimiter: '\r\n' });
    this.serialPort.pipe(this.serialParser);
    this.serialParser.on('data', (line) => {
      this.emit('line', line);
      if (P1Parser.isStart(line)) this.emit('line', '');
    });
    this.reading = true;
  }

  public startWithSocket(host: string, port: number): void {
    this.socket = new Socket();
    this.socket.setTimeout(60 * 1000, () => {
      console.warn('Socket timeout');
      this.socket?.end();
      process.exit(100);
    });
    this.socket.connect(port, host);
    this.socket.setEncoding(this.encryption === true ? 'hex' : 'ascii');
    this.socket.on('data', (data) => {
      if (this.bufferInterval) {
        clearTimeout(this.bufferInterval);
      }
      this.dataBuffer += data.toString();
      this.bufferInterval = setTimeout(() => {
        this.processBuffer();
      }, 100);
    });

    this.socket.on('close', () => {
      console.warn('Socket connection closed');
      process.exit(10);
    });
  }

  private processBuffer(): void {
    const data = this.encryption === true
      ? this.crypt?.decryptToDsmr(this.dataBuffer)?.message
      : this.dataBuffer;
    if (data !== undefined && data !== '') {
      const lines = data.trim().split('\r\n');
      lines.forEach((line) => {
        this.emit('line', line);
      });
    }
    this.dataBuffer = '';
  }

  public startParsing(): void {
    if (this.parsing) return;
    this.parser = new P1Parser();
    this.on('line', (line) => { this.parseLine(line.trim()); });
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
    this.emit('raw', originalMessage);
    const result = this.parser.data;
    if (!result.crc) {
      this.emit('errorMessage', 'CRC failed');
      return;
    }
    const solar = this.solarInput ? await this.solarInput.getSolarData() : undefined;
    if (solar) {
      result.calculatedUsage = Math.round(((result.currentUsage || 0.0) - (result.currentDelivery || 0.0)) * 1000);
      result.solarProduction = await this.solarInput?.getCurrentProduction();
      result.houseUsage = Math.round((result.solarProduction ?? 0) + result.calculatedUsage);
      this.emit('solar', solar);
    } else {
      result.calculatedUsage = Math.round(((result.currentUsage || 0.0) - (result.currentDelivery || 0.0)) * 1000);
    }

    this.lastResult = result;
    this.emit('dsmr', this.lastResult);

    const newUsage = (result.houseUsage ?? result.calculatedUsage);
    if (this.usage !== newUsage) {
      const relative = (newUsage - this.usage);
      this.emit('usage', {
        previousUsage: this.usage,
        currentUsage: newUsage,
        relative,
        message: `Usage ${(relative > 0 ? 'increased +' : 'decreased ')}${relative} to ${newUsage}`,
      });
      this.usage = newUsage;
    }

    /**
     * Handle the gas value - this is a bit different from electricity usage, the meter does not
     * indicate the actual gas usage in m3/hour but only submits the meter reading every XX minutes
     */
    const gas = result.xGas ?? result.gas;
    if (gas) {
      const currentGasReadingTimestamp = (new Date(((gas as GasValue)).ts ?? 0).getTime() / 1000);
      const period = currentGasReadingTimestamp - this.gasReadingTimestamp;
      /**
       * Report for every new timestamp
       */
      if (period) {
        const newGasReading = ((gas as GasValue).totalUse ?? 0);
        const relative = this.gasReading ? (newGasReading - this.gasReading) : 0;
        let newGasUsage = 0;

        /**
         * Gas usage in m3 per hour
         */
        newGasUsage = relative * (3600 / period);

        /**
         * Gas usage is measured in thousands (0.001) - round the numbers
         * accordingly
         */
        this.emit('gasUsage', {
          previousUsage: parseFloat(this.gasUsage.toFixed(3)),
          currentUsage: parseFloat(newGasUsage.toFixed(3)),
          relative: parseFloat(relative.toFixed(3)),
          message: `Reading increased +${relative} to ${newGasReading}`,
        });

        this.gasReadingTimestamp = currentGasReadingTimestamp;
        this.gasReading = newGasReading;
        this.gasUsage = newGasUsage;
      }
    }
  }

  public close(): Promise<void> {
    if (this.solarInput) {
      this.solarInput = undefined;
    }
    return new Promise<void>((resolve, reject) => {
      this.reading = false;
      if (this.serialPort) {
        this.serialPort.close((err) => {
          if (err) reject(err);
          else resolve();
        });
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
