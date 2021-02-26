import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { SunspecResult } from '@svrooij/sunspec/lib/sunspec-result';
import Output from './output';
import P1ReaderEvents from '../p1-reader-events';
import { MqttConfig } from '../config';
import P1Reader from '../p1-reader';
import DsmrMessage from '../dsmr-message';


export default class MqttOutput extends Output {
  private mqtt?: MqttClient;

  private discoverySend = false;

  constructor(private config: MqttConfig) {
    super();
  }

  start(p1Reader: P1Reader): void {
    this.mqtt = mqtt.connect(this.config.url, this.MqttOptions);
    this.mqtt.on('connect', () => {
      this.mqtt?.publish(`${this.config.prefix}/connected`, '2', { qos: 0, retain: true });
    });

    p1Reader.on(P1ReaderEvents.ParsedResult, (data) => {
      this.publishData(data);
      if (this.config.discovery && !this.discoverySend) {
        this.publishAutoDiscovery(data);
        this.discoverySend = true;
      }
    });

    p1Reader.on(P1ReaderEvents.UsageChanged, (data) => {
      this.publishUsage(data);
    });

    p1Reader.on(P1ReaderEvents.GasUsageChanged, (data) => {
      this.publishGasUsage(data);
    });

    p1Reader.on(P1ReaderEvents.SolarResult, (data) => {
      this.publishSolar(data);
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.mqtt?.end(false, {}, resolve);
    });
  }

  private get MqttOptions(): IClientOptions {
    return {
      will: {
        topic: `${this.config.prefix}/connected`,
        retain: true,
        payload: '0',
        qos: 0,
      },
    };
  }

  private getTopic(suffix: string): string {
    return `${this.config.prefix}/status/${suffix}`;
  }

  private publishUsage(data: any): void {
    const message = data;
    message.val = data.currentUsage;
    delete message.currentUsage;
    message.tc = Date.now();
    this.mqtt?.publish(this.getTopic('usage'), JSON.stringify(message), { qos: 0, retain: false });
  }

  private publishGasUsage(data: any): void {
    const message = data;
    message.val = data.currentUsage;
    delete message.currentUsage;
    message.tc = Date.now();
    this.mqtt?.publish(this.getTopic('gasUsage'), JSON.stringify(message), { qos: 0, retain: false });
  }

  private publishData(data: DsmrMessage): void {
    if (this.config.distinct) {
      this.config.distinctFields.forEach((element) => {
        if (data[element]) {
          const distinctVal = { ts: Date.now(), val: data[element] };
          this.sendToMqtt(element, distinctVal);
        }
      });
    } else {
      this.sendToMqtt('energy', data);
    }
  }

  private publishSolar(data: SunspecResult): void {
    this.sendToMqtt('solar', data);
  }

  private sendToMqtt(topicSuffix: string, data: any): void {
    this.mqtt?.publish(this.getTopic(topicSuffix), JSON.stringify(data), { qos: 0, retain: true });
  }

  private publishAutoDiscovery(data: DsmrMessage): void {
    // Current usage
    const device = {
      // json_attributes: true,
      device_class: 'power',
      // schema: 'json',
      // json_attributes_topic: `${this._options.topic}/status/enegry`,
      state_topic: `${this.config.prefix}/status/energy`,
      availability_topic: `${this.config.prefix}/connected`,
      payload_available: '2',
      name: 'Current power usage',
      icon: 'mdi:speedometer',
      unit_of_measurement: 'Watt',
      value_template: '{{value_json.calculatedUsage}}',
      unique_id: `smartmeter_${data.powerSn}_current-usage`,
    };
    this.mqtt?.publish(`${this.config.discoveryPrefix}/sensor/smartmeter/power-usage/config`, JSON.stringify(device), { qos: 0, retain: true });

    delete device.icon;

    if (data.totalImportedEnergyP) {
      device.unique_id = `smartmeter_${data.powerSn}_total_imported`;
      device.unit_of_measurement = 'kWh';
      device.value_template = '{{value_json.totalImportedEnergyP}}';
      device.name = 'Total power imported';
      this.mqtt?.publish(`${this.config.discoveryPrefix}/sensor/smartmeter/power-imported/config`, JSON.stringify(device), { qos: 0, retain: true });
    }

    if (data.totalExportedEnergyQ) {
      device.unique_id = `smartmeter_${data.powerSn}_total_exported`;
      device.unit_of_measurement = 'kvarh';
      device.value_template = '{{value_json.totalExportedEnergyQ}}';
      device.name = 'Total power exported';
      this.mqtt?.publish(`${this.config.discoveryPrefix}/sensor/smartmeter/power-exported/config`, JSON.stringify(device), { qos: 0, retain: true });
    }

    if (data.totalT1Use) {
      // Total T1
      device.unique_id = `smartmeter_${data.powerSn}_total_t1_used`;
      device.unit_of_measurement = 'kWh';
      device.value_template = '{{value_json.totalT1Use}}';
      device.name = 'Total power used T1';
      this.mqtt?.publish(`${this.config.discoveryPrefix}/sensor/smartmeter/t1-used/config`, JSON.stringify(device), { qos: 0, retain: true });
    }

    if (data.totalT2Use) {
      // Total T2
      device.unique_id = `smartmeter_${data.powerSn}_total_t2_used`;
      device.unit_of_measurement = 'kWh';
      device.value_template = '{{value_json.totalT2Use}}';
      device.name = 'Total power used T2';
      this.mqtt?.publish(`${this.config.discoveryPrefix}/sensor/smartmeter/t2-used/config`, JSON.stringify(device), { qos: 0, retain: true });
    }

    if (data.totalT1Delivered) {
      // Total T1 delivered
      device.unique_id = `smartmeter_${data.powerSn}_total_t1_delivered`;
      device.unit_of_measurement = 'kWh';
      device.value_template = '{{value_json.totalT1Delivered}}';
      device.name = 'Total power delivered T1';
      this.mqtt?.publish(`${this.config.discoveryPrefix}/sensor/smartmeter/t1-delivered/config`, JSON.stringify(device), { qos: 0, retain: true });
    }

    if (data.totalT2Delivered) {
      // Total T2 delivered
      device.unique_id = `smartmeter_${data.powerSn}_total_t2_delivered`;
      device.unit_of_measurement = 'kWh';
      device.value_template = '{{value_json.totalT2Delivered}}';
      device.name = 'Total power delivered T2';
      this.mqtt?.publish(`${this.config.discoveryPrefix}/sensor/smartmeter/t2-delivered/config`, JSON.stringify(device), { qos: 0, retain: true });
    }

    // Total Gas used
    if (data.gasSn) {
      device.unique_id = `smartmeter_${data.gasSn}_total_gas`;
      device.unit_of_measurement = 'm³';
      device.value_template = '{{value_json.gas.totalUse}}';
      device.name = 'Total gas usage';
      device.icon = 'mdi:gas-cylinder';
      delete device.device_class;
      this.mqtt?.publish(`${this.config.discoveryPrefix}/sensor/smartmeter/gas/config`, JSON.stringify(device), { qos: 0, retain: true });
    }
  }
}
