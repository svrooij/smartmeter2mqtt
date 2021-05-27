import { InfluxDB, Point, WriteApi } from '@influxdata/influxdb-client';
import P1Reader from '../p1-reader';
import { Output } from './output';

export interface InfluxOutputOptions {
  url: string;
  token: string;
  bucket: string;
  org: string;
}

export class InfluxOutput implements Output {
  private client: InfluxDB;

  private writeApi: WriteApi;

  constructor(private options: InfluxOutputOptions) {
    this.client = new InfluxDB({ url: options.url, token: options.token });
    this.writeApi = this.client.getWriteApi(options.org, options.bucket, undefined, { flushInterval: 30000 });
  }

  start(p1Reader: P1Reader): void {
    p1Reader.on('dsmr', (dsmr) => {
      const powerPoint = new Point('power-total');
      if (dsmr.powerSn) {
        powerPoint.tag('meter', dsmr.powerSn);
      }

      if (dsmr.totalT1Delivered) powerPoint.floatField('T1Delivered', dsmr.totalT1Delivered);
      if (dsmr.totalT1Use) powerPoint.floatField('T1Used', dsmr.totalT1Use);
      if (dsmr.totalT2Delivered) powerPoint.floatField('T2Delivered', dsmr.totalT2Delivered);
      if (dsmr.totalT2Use) powerPoint.floatField('T2Used', dsmr.totalT2Use);

      this.writeApi.writePoint(powerPoint);

      if (dsmr.gasSn && dsmr.gas?.totalUse) {
        const gasPoint = new Point('gas-total');
        gasPoint.tag('meter', dsmr.gasSn);
        gasPoint.floatField('used', dsmr.gas.totalUse);
        this.writeApi.writePoint(gasPoint);
      }

      if (dsmr.calculatedUsage) {
        const powerUsage = new Point('power-usage');
        powerUsage.floatField('usage', dsmr.calculatedUsage);
        if (dsmr.currentTarrif) powerUsage.tag('tarrif', dsmr.currentTarrif.toString());
        if (dsmr.houseUsage) powerUsage.floatField('house', dsmr.houseUsage);
        if (dsmr.solarProduction) powerUsage.floatField('production', dsmr.solarProduction);
        this.writeApi.writePoint(powerUsage);
      }
    });
  }

  async close(): Promise<void> {
    await this.writeApi.flush();
    await this.writeApi.close();
  }
}
