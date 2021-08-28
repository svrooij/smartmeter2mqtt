import { SunspecReader } from '@svrooij/sunspec';
import { SunspecResult } from '@svrooij/sunspec/lib/sunspec-result';

import BaseSolarReader from './base-solar-input';

export default class ModbusSolarInput extends BaseSolarReader {
  private modbus: SunspecReader;

  private lastResult?: Partial<SunspecResult>;

  private interval?: NodeJS.Timeout;

  constructor(host: string, port = 502, interval: number | undefined = undefined) {
    super();
    this.modbus = new SunspecReader(host, port);
    this.modbus.readInverterInfo()
      .catch((err) => {
        console.warn('Error loading inverter data', err);
      });

    if (interval && interval > 900) {
      this.interval = setInterval(async () => {
        const result = await this.getSolarOrUndefined();
        if (result) {
          this.lastResult = result;
          this.emit('solar', result);
        }
      }, interval);
    }
  }

  async getCurrentProduction(): Promise<number | undefined> {
    if (!this.lastResult) {
      await this.getSolarData();
    }
    if (this.lastResult) {
      return this.lastResult.acPower;
    }
    return undefined;
  }

  async getSolarData(): Promise<Partial<SunspecResult> | undefined> {
    if (!this.interval || !this.lastResult) {
      this.lastResult = await this.getSolarOrUndefined();
    }
    return this.lastResult;
  }

  private getSolarOrUndefined(): Promise<Partial<SunspecResult> | undefined> {
    return this.modbus.readData()
      .catch((err) => {
        console.warn('Error loading data from modbus', err);
        return undefined;
      });
  }

  close(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}
