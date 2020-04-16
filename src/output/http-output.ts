import fetch, { Response } from 'node-fetch';
import { URLSearchParams } from 'url';

import { HttpPostConfig } from '../config';
import { IntervalOutput } from './interval-output';
import P1Reader from '../p1-reader';
import P1ReaderEvents from '../p1-reader-events';

export class HttpOutput extends IntervalOutput {
  private fields?: Array<string>;

  constructor(private config: HttpPostConfig) {
    super(config.interval);
  }

  start(p1Reader: P1Reader) {
    super.start(p1Reader);
    this.fields = this.config.fields.split(',');
    this.on(P1ReaderEvents.ParsedResult, (data) => this._sendEvent(data)
      .then((result) => {
        if (!result.ok) {
          throw new Error(result.statusText);
        }
      })
      .catch((err) => {
        this.emit(P1ReaderEvents.ErrorMessage, err);
      }));
  }


  _sendEvent(data: any): Promise<Response> {
    let flatData = HttpOutput.flatten(data);
    if (this.fields) {
      flatData = this._filterData(flatData);
    }

    if (this.config.json) {
      return fetch(this.config.url, {
        method: 'post',
        body: JSON.stringify(flatData),
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return fetch(this.config.url, {
      method: 'post',
      body: new URLSearchParams(flatData),
    });
  }

  _filterData(data: any): any {
    if (this.fields === undefined) {
      return data;
    }
    const result: {[key: string]: any} = {};
    const { fields } = this;
    Object.keys(data)
      .filter((key) => fields.includes(key))
      .forEach((key) => {
        result[key] = data[key];
      });
    return result;
  }

  private static flatten(data: any) {
    if (data.gas) {
      data.gas_ts = data.gas.ts;
      data.gas_totalUse = data.gas.totalUse;
      delete data.gas;
    }
    return data;
  }
}
