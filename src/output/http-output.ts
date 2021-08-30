import fetch, { Response } from 'node-fetch';
import { URLSearchParams } from 'url';
import { HttpPostConfig } from '../config';
import IntervalOutput from './interval-output';
import P1Reader from '../p1-reader';
import DsmrMessage from '../dsmr-message';
import GasValue from '../gas-value';

export default class HttpOutput extends IntervalOutput {
  constructor(private config: HttpPostConfig) {
    super(config.interval);
  }

  start(p1Reader: P1Reader): void {
    super.start(p1Reader);
    this.on('dsmr', (data) => this.sendEvent(data)
      .then((result) => {
        if (!result.ok) {
          throw new Error(result.statusText);
        }
      })
      .catch((err) => {
        this.emit('dsmr', err);
      }));
  }

  // addSolar(solarReader: BaseSolarReader): void {

  // }

  private sendEvent(data: DsmrMessage): Promise<Response> {
    const flatData = this.config.fields
      ? this.filterData(HttpOutput.flatten(data))
      : HttpOutput.flatten(data);

    if (this.config.json) {
      return fetch(this.config.url, {
        method: 'post',
        body: JSON.stringify(flatData),
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return fetch(this.config.url, {
      method: 'post',
      body: new URLSearchParams(flatData as any),
    });
  }

  private filterData(data: DsmrMessage): {[key: string]: string | number | Array<string> | GasValue | boolean | undefined} {
    if (this.config.fields === undefined) {
      return data;
    }
    const result: {[key: string]: string | number | Array<string> | GasValue | boolean | undefined} = {};
    Object.keys(data)
      .filter((key) => this.config.fields?.includes(key))
      .forEach((key) => {
        result[key] = data[key];
      });
    return result;
  }

  private static flatten(data: DsmrMessage): DsmrMessage {
    if (data.gas) {
      const result = data;
      result.gas_ts = data.gas.ts;
      result.gas_totalUse = data.gas.totalUse;
      delete result.gas;
      return result;
    }
    return data;
  }
}
