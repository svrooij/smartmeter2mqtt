import fetch, { Response } from 'node-fetch';
import { URLSearchParams } from 'url';
import { HttpPostConfig } from '../config';
import IntervalOutput from './interval-output';
import P1Reader from '../p1-reader';
import P1ReaderEvents from '../p1-reader-events';
import DsmrMessage from '../dsmr-message';
import GasValue from '../gas-value';

export default class HttpOutput extends IntervalOutput {
  private fields?: Array<string>;

  constructor(private config: HttpPostConfig) {
    super(config.interval);
  }

  start(p1Reader: P1Reader): void {
    super.start(p1Reader);
    this.fields = this.config.fields.split(',');
    this.on(P1ReaderEvents.ParsedResult, (data) => this.sendEvent(data)
      .then((result) => {
        if (!result.ok) {
          throw new Error(result.statusText);
        }
      })
      .catch((err) => {
        this.emit(P1ReaderEvents.ErrorMessage, err);
      }));
  }

  private sendEvent(data: DsmrMessage): Promise<Response> {
    const flatData = this.fields
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
    if (this.fields === undefined) {
      return data;
    }
    const result: {[key: string]: string | number | Array<string> | GasValue | boolean | undefined} = {};
    const { fields } = this;
    Object.keys(data)
      .filter((key) => fields.includes(key))
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
