import yargs from 'yargs';
import fs from 'fs';
import path from 'path';
import { InfluxOutputOptions } from './output/influx-output';

export interface HttpPostConfig {
  fields?: Array<string>;
  interval: number;
  json: boolean;
  url: string;
}

const defaultHttpPostConfig: Partial<HttpPostConfig> = {
  fields: ['powerTs', 'totalT1Use', 'totalT1Delivered', 'totalT2Use', 'totalT1Delivered', 'gas_totalUse', 'gas_ts'],
  interval: 300,
};

export interface MqttConfig {
  discovery: boolean;
  discoveryPrefix: string;
  distinct: boolean;
  distinctFields: Array<string>;
  prefix: string;
  url: string;
  last_reset?: string;
  last_reset_solar?: string;
}

const defaultMqttConfig: Partial<MqttConfig> = {
  discovery: false,
  discoveryPrefix: 'homeassistant',
  distinct: false,
  distinctFields: ['currentTarrif', 'totalT1Use', 'totalT2Use', 'totalT1Delivered', 'totalT2Delivered', 'powerSn', 'currentUsage', 'currentDelivery'],
  prefix: 'smartmeter',
};

export interface SunspecConfig {
  host: string;
  port: number;
  interval?: number;
}

export interface OutputConfig {
  debug: boolean;
  influx?: InfluxOutputOptions;
  jsonSocket?: number;
  mqtt?: MqttConfig;
  mqttSocket?: number;
  post?: HttpPostConfig;
  rawSocket?: number;
  webserver?: number;
}

export interface EncryptionConfig {
  aad: string;
  key: string;
}

export interface SmartmeterConfig {
  serialPort?: string;
  socket?: string;

  encryption?: EncryptionConfig;

  outputs: OutputConfig;
  solar?: SunspecConfig;
}

const defaultConfig: SmartmeterConfig = {
  outputs: {
    debug: false,
  },
};

const defaultEncryptionAad = '3000112233445566778899AABBCCDDEEFF';

export class ConfigLoader {
  public static Load(): SmartmeterConfig {
    const config = { ...defaultConfig, ...(ConfigLoader.LoadConfigFromFile() ?? ConfigLoader.LoadConfigFromArguments()) };

    if (config.outputs.mqtt) {
      config.outputs.mqtt = { ...defaultMqttConfig, ...config.outputs.mqtt };
    }

    if (config.outputs.post) {
      config.outputs.post = { ...defaultHttpPostConfig, ...config.outputs.post };
    }

    if (config.encryption && !config.encryption.aad) {
      config.encryption.aad = defaultEncryptionAad;
    }

    return config;
  }

  public static LoadPackageData(): { name: string; version: string; description?: string } {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')).toString());
  }

  public static LoadConfigFromArguments(): Partial<SmartmeterConfig> {
    const pkg = ConfigLoader.LoadPackageData();
    const options = yargs
      .env('SMARTMETER')
      .usage(`${pkg.name} ${pkg.version}\n${pkg.description
      }\n\nRead from P1 to USB serial:\n$0 --port /dev/ttyUSB0 [options]`
        + '\n\nRead from tcp socket:\n$0 --socket host:port [options]')
      .epilog('All options can also be specified as Environment valiables'
        + '\r\nPrefix them with \'SMARTMETER_\' and make them all uppercase')
      .options({
        port: { type: 'string' },
        socket: { type: 'string' },
        debug: { type: 'boolean' },
        'web-server': { type: 'number' },
        'tcp-server': { type: 'number' },
        'raw-tcp-server': { type: 'number' },
        'tcp-server-mqtt': { type: 'number' },

        'post-url': { type: 'string' },
        'post-interval': { type: 'number' },
        'post-json': { type: 'boolean' },
        'post-fields': { type: 'string' },

        'mqtt-url': { type: 'string' },
        'mqtt-topic': { type: 'string' },
        'mqtt-distinct': { type: 'boolean' },
        'mqtt-distinct-fields': { type: 'string' },
        'mqtt-discovery': { type: 'boolean' },
        'mqtt-discovery-prefix': { type: 'string' },
        'mqtt-last-reset': { type: 'string' },
        'mqtt-last-reset-solar': { type: 'string' },

        'influx-url': { type: 'string' },
        'influx-token': { type: 'string' },
        'influx-bucket': { type: 'string' },
        'influx-org': { type: 'string' },

        'enc-aad': { type: 'string' },
        'enc-key': { type: 'string' },

        'sunspec-modbus': { type: 'string' },
        'sunspec-modbus-port': { type: 'number' },
        'sunspec-interval': { type: 'number' },
      })
      .describe('port', 'The serial port to read, P1 to serial usb, eg. \'/dev/ttyUSB0\'')
      .describe('socket', 'The tcp socket to read, if reading from serial to network device, as host:port, like \'192.168.0.3:3000\'')
      .conflicts('port', 'socket')

      .describe('debug', 'Enable debug output')
      .describe('tcp-server', 'Expose JSON TCP socket on this port')
      .describe('tcp-server-mqtt', 'Expose JSON TCP socket on this port')
      .describe('raw-tcp-server', 'Expose RAW TCP socket on this port')
      .describe('web-server', 'Expose webserver on this port')

      .describe('post-url', 'Post the results to this url')
      .describe('post-interval', 'Seconds between posts')
      .describe('post-json', 'Post the data as json instead of form parameters')
      .describe('post-fields', 'Fields to post')
      
      .describe('mqtt-url', 'Send the data to this mqtt server')
      .describe('mqtt-topic', 'Use this topic prefix for all messages')
      .describe('mqtt-distinct', 'Publish data distinct to mqtt')
      .describe('mqtt-distinct-fields', 'A comma separated list of fields you want published distinct.')
      .describe('mqtt-discovery', 'Emit auto-discovery message')
      .describe('mqtt-discovery-prefix', 'Autodiscovery prefix')
      .describe('mqtt-last-reset', 'If set, this value is added to mqtt as \'last_reset\'')
      .describe('mqtt-last-reset-solar', 'If set, this value is added to mqtt as \'last_reset\'')

      .describe('influx-url', 'Influxdb server url')
      .describe('influx-token', 'Influxdb server token')
      .describe('influx-bucket', 'Influx bucket')
      .describe('influx-org', 'Influx organization')

      .describe('sunspec-modbus', 'IP of solar inverter with modbus TCP enabled')
      .describe('sunspec-modbus-port', 'modbus TCP port')
      .describe('sunspec-interval', 'Interval for solar reading')

      .describe('enc-aad', 'Additional authentication data, if your meter encrypts data (eg. Luxemburg)')
      .describe('enc-key', 'Decryption key. Request from energy company')
      
      .alias({
        h: 'help',
      })
      .default({
        'post-interval': defaultHttpPostConfig.interval ?? 300,
        'mqtt-topic': defaultMqttConfig.prefix ?? 'smartmeter',
        'mqtt-discovery-prefix': defaultMqttConfig.discoveryPrefix ?? 'homeassistant',
        'sunspec-modbus-port': 502,
        'enc-aad': defaultEncryptionAad,
      })
      .wrap(80)
      .version()
      .help('help');

    const args = options.parseSync();

    const config = {
      serialPort: args.port,
      socket: args.socket,
      outputs: {
        debug: args.debug === true,
      },
    } as SmartmeterConfig;

    if (args['tcp-server']) {
      config.outputs.jsonSocket = args['tcp-server'];
    }

    if (args['tcp-server-mqtt']) {
      config.outputs.mqttSocket = args['tcp-server-mqtt'];
    }

    if (typeof args['mqtt-url'] === 'string') {
      config.outputs.mqtt = {
        discovery: args['mqtt-discovery'] === true,
        discoveryPrefix: args['mqtt-discovery-prefix'] ?? 'homeassistant',
        distinct: args['mqtt-distinct'] === true,
        distinctFields: args['mqtt-distinct-fields']?.split(',') ?? defaultMqttConfig.distinctFields ?? [],
        prefix: args['mqtt-topic'] ?? 'smartmeter',
        url: args['mqtt-url'],
        last_reset: args['mqtt-last-reset'],
        last_reset_solar: args['mqtt-last-reset-solar'],
      };
    }

    if (args['influx-url'] && args['influx-token'] && args['influx-org'] && args['influx-bucket']) {
      config.outputs.influx = {
        url: args['influx-url'] as string,
        token: args['influx-token'] as string,
        org: args['influx-org'] as string,
        bucket: args['influx-bucket'] as string,
      };
    }

    if (typeof args['post-url'] === 'string') {
      config.outputs.post = {
        fields: args['post-fields']?.split(','),
        interval: args['post-interval'],
        json: args['post-json'] === true,
        url: args['post-url'],
      };
    }

    if (args['raw-tcp-server']) {
      config.outputs.rawSocket = args['raw-tcp-server'];
    }

    if (args['web-server']) {
      config.outputs.webserver = args['web-server'];
    }

    if (args['sunspec-modbus']) {
      config.solar = {
        host: args['sunspec-modbus'],
        port: args['sunspec-modbus-port'],
        interval: args['sunspec-interval'],
      } as SunspecConfig;
    }

    if (args['enc-key']) {
      config.encryption = {
        aad: args['enc-aad'],
        key: args['enc-key'],
      };
    }

    return config;
  }

  private static LoadConfigFromFile(): Partial<SmartmeterConfig> | undefined {
    // https://developers.home-assistant.io/docs/hassio_addon_config
    if (process.env.CONFIG_PATH === undefined) process.env.CONFIG_PATH = '/data/options.json';
    if (fs.existsSync(process.env.CONFIG_PATH)) {
      const fileContent = fs.readFileSync(process.env.CONFIG_PATH).toString();
      return JSON.parse(fileContent) as Partial<SmartmeterConfig>;
    }
    return undefined;
  }
}
