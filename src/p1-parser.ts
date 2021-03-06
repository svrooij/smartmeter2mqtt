import { crc16 } from 'crc';
import P1Map from './p1-map';
import DsmrMessage from './dsmr-message';

export default class P1Parser {
  private currentMessage: string;

  private partialData: DsmrMessage;

  public constructor() {
    this.currentMessage = '';
    this.partialData = {
      crc: false,
    };
  }

  /**
   * Add the next line to the parser, returns true if complete message is ready
   *
   * @param {string} line
   * @returns {boolean}
   * @memberof P1Parser
   */
  public addLine(line: string): boolean {
    const isEnd = P1Parser.isEnd(line);
    if (line.length > 0) {
      if (!isEnd) {
        this.currentMessage += `${line}\r\n`; // Append line to compute CRC
      }

      if (P1Parser.isStart(line)) {
        this.partialData.header = line.substr(1);
        this.currentMessage += '\r\n';
      } else if (isEnd) {
        // Always to crc check, it can fail, we still want te result.
        const calculatedCrc = crc16(`${this.currentMessage}!`).toString(16).toUpperCase();
        // console.log('Calculated CRC %s line: %s', calculatedCrc, line)
        this.partialData.crc = calculatedCrc === line.substr(1);

        this.currentMessage += `${line}\r\n`;
        return true;
      } else {
        const parsed = P1Map.parseLine(line);
        if (parsed && parsed.name) {
          if (parsed.value !== undefined) {
            this.partialData[parsed.name] = parsed.value;
          } else if (parsed.rawValues !== undefined) {
            this.partialData[parsed.name] = parsed.rawValues;
          }
        }
      }
    }
    return false;
  }

  public get data(): DsmrMessage {
    return this.partialData;
  }

  public get message(): string {
    return this.currentMessage;
  }

  // Statics
  public static isStart(line: string): boolean {
    return line.length > 0 && line.startsWith('/');
  }

  private static isEnd(line: string): boolean {
    return line.length > 0 && line.startsWith('!');
  }
}
