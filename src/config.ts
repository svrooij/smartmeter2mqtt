import yargs from 'yargs';
import fs from 'fs';
import path from 'path';

export interface HttpPostConfig {
  fields: string;
  interval: number;
  json: boolean;
  url: string;
}

export interface MqttConfig {
  discovery: boolean;
  discoveryPrefix: string;
  distinct: boolean;
  distinctFields: Array<string>;
  prefix: string;
  url: string;
}

export interface SunspecConfig {
  host: string;
  port: number;
}

export interface OutputConfig {
  debug: boolean;
  jsonSocket?: number;
  mqtt?: MqttConfig;
  post?: HttpPostConfig;
  rawSocket?: number;
  webserver?: number;
}

export interface Config {
  serialPort?: string;
  socket?: string;

  outputs: OutputConfig;
  solar?: SunspecConfig;
}

export class ConfigLoader {
  public static Load(): Config {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')).toString());
    const args = yargs
      .env('SMARTMETER')
      .usage(`${pkg.name} ${pkg.version}\n${pkg.description
      }\n\nRead from P1 to USB serial:\n$0 --port /dev/ttyUSB0 [options]`
        + '\n\nRead from tcp socket:\n$0 --socket host:port [options]')
      .epilog('All options can also be specified as Environment valiables'
        + '\r\nPrefix them with \'SMARTMETER_\' and make them all uppercase')
      .describe('port', 'The serial port to read, P1 to serial usb, eg. \'/dev/ttyUSB0\'')
      .describe('socket', 'The tcp socket to read, if reading from serial to network device, as host:port, like \'192.168.0.3:3000\'')
      .describe('web-server', 'Expose webserver on this port')
      .describe('post-url', 'Post the results to this url')
      .describe('post-interval', 'Seconds between posts')
      .describe('post-json', 'Post the data as json instead of form parameters')
      .boolean('post-json')
      .describe('mqtt-url', 'Send the data to this mqtt server')
      .describe('mqtt-topic', 'Use this topic prefix for all messages')
      .describe('mqtt-distinct', 'Publish data distinct to mqtt')
      .boolean('mqtt-distinct')
      .describe('mqtt-distinct-fields', 'A comma separated list of fields you want published distinct.')
      .describe('mqtt-discovery', 'Emit auto-discovery message')
      .boolean('mqtt-discovery')
      .describe('mqtt-discovery-prefix', 'Autodiscovery prefix')
      .describe('tcp-server', 'Expose JSON TCP socket on this port')
      .describe('raw-tcp-server', 'Expose RAW TCP socket on this port')
      .conflicts('port', 'socket')
      .describe('debug', 'Enable debug output')
      .boolean('debug')
      .describe('sunspec-modbus', 'IP of solar inverter with modbus TCP enabled')
      .describe('sunspec-modbus-port', 'modbus TCP port')
      .number('sunspec-modbus-port')
      .number('web-server')
      .number('tcp-server')
      .number('raw-tcp-server')
      .number('post-interval')
      .alias({
        h: 'help',
      })
      .default({
        'post-interval': 300,
        'mqtt-topic': 'smartmeter',
        'mqtt-discovery-prefix': 'homeassistant',
        'sunspec-modbus-port': 502,
        'mqtt-distinct-fields': 'currentTarrif,totalT1Use,totalT2Use,totalT1Delivered,totalT2Delivered,powerSn,currentUsage,currentDelivery',
      })
      .wrap(80)
      .version()
      .help('help')
      .argv;

    const config = {
      serialPort: args.port,
      socket: args.socket,
      outputs: {
        debug: args.debug === true,
      },
    } as Config;

    if (args['tcp-server']) {
      config.outputs.jsonSocket = args['tcp-server'];
    }

    if (typeof args['mqtt-url'] === 'string') {
      config.outputs.mqtt = {
        discovery: args['mqtt-discovery'] === true,
        discoveryPrefix: args['mqtt-discovery-prefix'] ?? 'homeassistant',
        distinct: args['mqtt-distinct'] === true,
        distinctFields: args['mqtt-distinct-fields'].split(','),
        prefix: args['mqtt-topic'] ?? 'smartmeter',
        url: args['mqtt-url'],
      };
    }

    if (typeof args['post-url'] === 'string') {
      config.outputs.post = {
        fields: 'powerTs,totalT1Use,totalT1Delivered,totalT2Use,totalT1Delivered,gas_totalUse,gas_ts', // Make configurable
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
      } as SunspecConfig;
    }

    return config;
  }
}
