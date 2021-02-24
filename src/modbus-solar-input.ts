import { SunspecReader } from '@svrooij/sunspec';
import { SunspecResult } from '@svrooij/sunspec/lib/sunspec-result';
import SolarInput from './solar-input';

export default class ModbusSolarInput implements SolarInput {
  private modbus: SunspecReader;

  private lastResult?: Partial<SunspecResult>;

  constructor(host: string, port = 502) {
    this.modbus = new SunspecReader(host, port);
    this.modbus.readInverterInfo()
      .catch((err) => {
        console.warn('Error loading inverter data', err);
      });
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

  async getSolarData(): Promise<any | undefined> {
    this.lastResult = await this.modbus.readData()
      .catch((err) => {
        console.warn('Error loading data from modbus', err);
        return undefined;
      });
    return this.lastResult;
  }
}
