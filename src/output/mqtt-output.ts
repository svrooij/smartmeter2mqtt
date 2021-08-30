import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { SunspecResult } from '@svrooij/sunspec/lib/sunspec-result';
import { Output } from './output';
import { MqttConfig, ConfigLoader } from '../config';
import P1Reader from '../p1-reader';
import DsmrMessage from '../dsmr-message';
import BaseSolarReader from '../solar/base-solar-input';

interface MqttDiscoveryMessage {
  availability?: [{ topic: string; payload_available?: string; payload_not_available?: string }];
  device: {
    identifiers: string[];
    manufacturer?: string;
    model?: string;
    name?: string;
    sw_version?: string;
  };
  device_class?: 'power' | 'current' | 'energy' | 'voltage';
  state_class?: 'measurement';
  json_attributes_topic: string;
  last_reset_value_template?: string;
  state_topic: string;
  name: string;
  icon?: string;
  unit_of_measurement?: string;
  value_template: string;
  unique_id: string;
}


export default class MqttOutput implements Output {
  private mqtt?: MqttClient;

  private discoverySend = false;

  private discoverySolarSend = false;

  private readonly pkg = ConfigLoader.LoadPackageData();

  constructor(private config: MqttConfig) {
  }

  start(p1Reader: P1Reader): void {
    this.mqtt = mqtt.connect(this.config.url, this.MqttOptions);
    this.mqtt.on('connect', () => {
      this.mqtt?.publish(`${this.config.prefix}/connected`, '2', { qos: 0, retain: true });
    });

    p1Reader.on('dsmr', (data) => {
      this.publishData(data);
      if (this.config.discovery && !this.discoverySend && this.mqtt?.connected) {
        this.publishAutoDiscovery(data);
        this.discoverySend = true;
      }
    });

    p1Reader.on('usage', (data) => {
      this.publishUsage(data);
    });

    p1Reader.on('gasUsage', (data) => {
      this.publishGasUsage(data);
    });
  }

  addSolar(solarReader: BaseSolarReader): void {
    solarReader.on('solar', (data) => {
      this.publishSolar(data);
      if (this.config.discovery && !this.discoverySolarSend && this.mqtt?.connected) {
        this.solarAutoDiscovery(data);
        this.discoverySolarSend = true;
      }
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.mqtt?.end(false, {}, () => { resolve(); });
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
      const withLifetime = {
        ...data,
        last_reset: this.config.last_reset,
      };
      this.sendToMqtt('energy', withLifetime);
    }
  }

  private publishSolar(data: Partial<SunspecResult>): void {
    const kwData = {
      ...data,
      lifetimeProductionKwh: ((data.lifetimeProduction || 0) / 1000).toFixed(2),
      acPowerKwh: ((data.acPower || 0) / 1000).toFixed(3),
      last_reset: this.config.last_reset_solar,
    };
    this.sendToMqtt('solar', kwData);
  }

  private sendToMqtt(topicSuffix: string, data: any): void {
    this.mqtt?.publish(this.getTopic(topicSuffix), JSON.stringify(data), { qos: 0, retain: true });
  }

  private publishAutoDiscovery(data: DsmrMessage): void {
    // Current usage
    const description: MqttDiscoveryMessage = {
      availability: [
        { topic: `${this.config.prefix}/connected`, payload_available: '2' },
      ],
      device: {
        identifiers: [
          `smartmeter_${data.powerSn}`,
        ],
        model: data.header,
        name: `DSMR power ${data.powerSn?.substr(-5, 5)}`,
        sw_version: `${this.pkg.name} (${this.pkg.version})`,
      },
      device_class: 'power',
      state_class: 'measurement',
      json_attributes_topic: `${this.config.prefix}/status/energy`,
      state_topic: `${this.config.prefix}/status/energy`,
      name: 'Current power usage',
      icon: 'mdi:transmission-tower',
      unit_of_measurement: 'Watt',
      value_template: '{{ value_json.calculatedUsage }}',
      unique_id: `smartmeter_${data.powerSn}_current-usage`,
    };

    this.publishDiscoveryMessage(`${this.config.discoveryPrefix}/sensor/${this.config.prefix}/power-usage/config`, description);

    if (data.totalImportedEnergyP) {
      description.unique_id = `smartmeter_${data.powerSn}_total_imported`;
      description.unit_of_measurement = 'kWh';
      description.value_template = '{{ value_json.totalImportedEnergyP }}';
      description.name = 'Total power imported';
      description.device_class = 'energy';
      this.publishDiscoveryMessage(`${this.config.discoveryPrefix}/sensor/${this.config.prefix}/power-imported/config`, description);
    }

    if (data.totalExportedEnergyQ) {
      description.unique_id = `smartmeter_${data.powerSn}_total_exported`;
      description.unit_of_measurement = 'kvarh';
      description.value_template = '{{ value_json.totalExportedEnergyQ }}';
      description.name = 'Total power exported';
      description.device_class = 'energy';
      this.publishDiscoveryMessage(`${this.config.discoveryPrefix}/sensor/${this.config.prefix}/power-exported/config`, description);
    }

    if (data.totalT1Use) {
      // Total T1
      description.unique_id = `smartmeter_${data.powerSn}_total_t1_used`;
      description.unit_of_measurement = 'kWh';
      description.value_template = '{{ value_json.totalT1Use }}';
      description.name = 'Total power used T1';
      description.device_class = 'energy';
      if (this.config.last_reset) description.last_reset_value_template = '{{ value_json.last_reset }}';
      this.publishDiscoveryMessage(`${this.config.discoveryPrefix}/sensor/${this.config.prefix}/t1-used/config`, description);
    }

    if (data.totalT2Use) {
      // Total T2
      description.unique_id = `smartmeter_${data.powerSn}_total_t2_used`;
      description.unit_of_measurement = 'kWh';
      description.value_template = '{{ value_json.totalT2Use }}';
      description.name = 'Total power used T2';
      description.device_class = 'energy';
      if (this.config.last_reset) description.last_reset_value_template = '{{ value_json.last_reset }}';
      this.publishDiscoveryMessage(`${this.config.discoveryPrefix}/sensor/${this.config.prefix}/t2-used/config`, description);
    }

    if (data.totalT1Delivered) {
      // Total T1 delivered
      description.unique_id = `smartmeter_${data.powerSn}_total_t1_delivered`;
      description.unit_of_measurement = 'kWh';
      description.value_template = '{{ value_json.totalT1Delivered }}';
      description.name = 'Total power delivered T1';
      description.device_class = 'energy';
      if (this.config.last_reset) description.last_reset_value_template = '{{ value_json.last_reset }}';
      this.publishDiscoveryMessage(`${this.config.discoveryPrefix}/sensor/${this.config.prefix}/t1-delivered/config`, description);
    }

    if (data.totalT2Delivered) {
      // Total T2 delivered
      description.unique_id = `smartmeter_${data.powerSn}_total_t2_delivered`;
      description.unit_of_measurement = 'kWh';
      description.value_template = '{{ value_json.totalT2Delivered }}';
      description.name = 'Total power delivered T2';
      description.device_class = 'energy';
      if (this.config.last_reset) description.last_reset_value_template = '{{ value_json.last_reset }}';
      this.publishDiscoveryMessage(`${this.config.discoveryPrefix}/sensor/${this.config.prefix}/t2-delivered/config`, description);
    }

    if (data.currentTarrif) {
      description.unique_id = `smartmeter_${data.powerSn}_current_tarrif`;
      delete description.unit_of_measurement;
      description.value_template = '{{ value_json.currentTarrif }}';
      description.name = 'Current tarrif';
      delete description.device_class;
      delete description.last_reset_value_template;
      this.publishDiscoveryMessage(`${this.config.discoveryPrefix}/sensor/${this.config.prefix}/current-tarrif/config`, description);
    }

    // if (data.houseUsage) {
    //   description.json_attributes_topic = `${this.config.prefix}/status/usage`;
    //   description.state_topic = `${this.config.prefix}/status/usage`;
    //   description.unique_id = `smartmeter_${data.powerSn}_house-usage`;
    //   description.unit_of_measurement = 'Watt';
    //   description.value_template = '{{ value_json.val }}';
    //   description.name = 'Current house usage';
    //   description.device_class = 'power';
    //   this.publishDiscoveryMessage(`${this.config.discoveryPrefix}/sensor/${this.config.prefix}/house-usage/config`, description);
    // }

    // Total Gas used
    if (data.gasSn) {
      description.device.identifiers = [
        `smartmeter_${data.gasSn}`,
      ];
      description.json_attributes_topic = `${this.config.prefix}/status/energy`;
      description.state_topic = `${this.config.prefix}/status/energy`;
      description.device.name = `DSMR gas ${data.gasSn?.substr(-5, 5)}`;
      description.unique_id = `smartmeter_${data.gasSn}_total_gas`;
      description.unit_of_measurement = 'm³';
      description.value_template = '{{ value_json.gas.totalUse }}';
      description.name = 'Total gas usage';
      description.icon = 'mdi:gas-cylinder';
      if (this.config.last_reset) description.last_reset_value_template = '{{ value_json.last_reset }}';
      delete description.device_class;
      this.publishDiscoveryMessage(`${this.config.discoveryPrefix}/sensor/${this.config.prefix}/gas/config`, description);
    }
  }

  private solarAutoDiscovery(solar: Partial<SunspecResult>): void {
    const description: MqttDiscoveryMessage = {
      availability: [
        { topic: `${this.config.prefix}/connected`, payload_available: '2' },
      ],
      device: {
        identifiers: [`solar-invertor_${solar.serial}`],
        manufacturer: solar.manufacturer,
        model: solar.model,
        name: `${solar.manufacturer} ${solar.model} ${solar.serial}`,
        sw_version: `${this.pkg.name} (${this.pkg.version})`,
      },
      unique_id: `solar-invertor_${solar.serial}_total`,
      unit_of_measurement: 'kWh',
      json_attributes_topic: `${this.config.prefix}/status/solar`,
      state_topic: `${this.config.prefix}/status/solar`,
      name: 'Lifetime solar production',
      icon: 'mdi:solar-power',
      device_class: 'energy',
      state_class: 'measurement',
      value_template: '{{ value_json.lifetimeProductionKwh }}',
    };
    if (this.config.last_reset_solar) description.last_reset_value_template = '{{ value_json.last_reset }}';

    this.publishDiscoveryMessage(`${this.config.discoveryPrefix}/sensor/${this.config.prefix}/solar-total/config`, description);

    description.name = 'Current solar production';
    description.unique_id = `solar-invertor_${solar.serial}_current`;
    description.unit_of_measurement = 'kW';
    description.value_template = '{{ value_json.acPowerKwh }}';
    description.device_class = 'power';
    delete description.last_reset_value_template;
    this.publishDiscoveryMessage(`${this.config.discoveryPrefix}/sensor/${this.config.prefix}/solar-current/config`, description);
  }

  private publishDiscoveryMessage(topic: string, message: MqttDiscoveryMessage): void {
    console.debug('MQTT auto discovery %s %s', topic, JSON.stringify(message));
    this.mqtt?.publish(topic, JSON.stringify(message), { qos: 0, retain: true });
  }
}
