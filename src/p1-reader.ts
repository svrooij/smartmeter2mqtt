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

  // Inverter stuff
  private solarInput?: SolarInput;

  constructor() {
    super();
    this.usage = 0;
    this.gasUsage = 0;
    this.gasReading = 0;
    this.gasReadingTimestamp = 0;
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
     * Handle the gas value - this is a bit different from electricity usage, the meter does not
     * indicate the actual gas usage in m3/hour but only submits the meter reading at certain
     * intervals and after a certain amount of gas has been used. The meter reading and the
     * timestamp can be used to compute the usage in m3/hour
     */
    const gas = result.xGas ?? result.gas;
    if (gas) {
      const newGasReading = ((gas as GasValue).totalUse ?? 0);
      /**
       * Report if there was gas usage but also report when gas usage
       * stopped
       */
      if (this.gasReading !== newGasReading || this.gasUsage) {
        const relative = this.gasReading ? (newGasReading - this.gasReading) : 0;
        let newGasUsage = 0;
        const currentGasReadingTimestamp = (new Date(((gas as GasValue)).ts ?? 0).getTime() / 1000);
        const period = currentGasReadingTimestamp - this.gasReadingTimestamp;

        /**
         * Gas usage in m3 per hour
         */
        if (period) {
          newGasUsage = relative * (3600 / period);
        }

        /**
         * Gas usage is measured in thousands (0.001) - round the numbers
         * accordingly
         */
        this.emit(P1ReaderEvents.GasUsageChanged, {
          previousUsage: this.gasUsage.toFixed(3),
          currentUsage: newGasUsage.toFixed(3),
          relative: relative.toFixed(3),
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
