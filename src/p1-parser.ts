import P1Map from './p1-map'
import { crc16 } from 'crc'
import DsmrMessage from './dsmr-message';

export default class P1Parser {
  private _message: string;
  private _data: DsmrMessage;

  public constructor() {
    this._message = '';
    this._data = {
      crc: false
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
    if(line.length > 0) {
      if (!isEnd) {
        this._message += `${line}\r\n`; // Append line to compute CRC
      }

      if (P1Parser.isStart(line)) {
        this._data.header = line.substr(1)
        this._message += '\r\n'
      } else if (isEnd) {
        // Always to crc check, it can fail, we still want te result.
        const calculatedCrc = crc16(this._message + '!').toString(16).toUpperCase()
        // console.log('Calculated CRC %s line: %s', calculatedCrc, line)
        this._data.crc = calculatedCrc === line.substr(1)

        this._message += `${line}\r\n`
        return true
      } else {
        const parsed = P1Map.parseLine(line);
        if (parsed && parsed.name) {
          if (parsed.value !== undefined) {
            this._data[parsed.name] = parsed.value;
          } else if(parsed.rawValues !== undefined) {
            this._data[parsed.name] = parsed.rawValues;
          }
        }
      }
    }
    return false;
  }

  public get data(): DsmrMessage {
    return this._data;
  }

  public get message(): string {
    return this._message;
  }

  // Statics
  static isStart (line: string): boolean {
    return line.length > 0 && line.startsWith('/')
  }

  static isEnd (line: string): boolean {
    return line.length > 0 && line.startsWith('!')
  }
}

