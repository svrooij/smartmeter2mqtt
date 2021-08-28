import P1Reader from './p1-reader';
import { SmartmeterConfig, ConfigLoader } from './config';
import { Output } from './output/output';
import WebServer from './output/web-server';
import TcpOutput from './output/tcp-output';
import MqttOutput from './output/mqtt-output';
import HttpOutput from './output/http-output';
import DebugOutput from './output/debug-output';
import { InfluxOutput } from './output/influx-output';

import ModbusSolarInput from './solar/modbus-solar-input';
import BaseSolarReader from './solar/base-solar-input';

export default class Smartmeter {
  private reader: P1Reader;

  private solar?: BaseSolarReader;

  private outputs: Array<Output> = [];

  constructor(private config: SmartmeterConfig = ConfigLoader.Load()) {
    console.clear();
    console.log('----------------------------------------');
    console.log('- Smartmeter2mqtt by Stephan van Rooij -');
    console.log('- https://svrooij.io                   -');
    console.log('- Press CTRL+C to close                -');
    console.log('----------------------------------------');
    this.reader = new P1Reader(this.config.encryption);
  }

  public async start(): Promise<void> {
    if (this.config.serialPort && this.config.serialPort.length > 0) {
      console.log('- Read serial port %s', this.config.serialPort);
      this.reader.startWithSerialPort(this.config.serialPort);
    } else if (this.config.socket && this.config.socket.length > 0) {
      const parts = this.config.socket.split(':');
      if (parts.length !== 2) {
        console.warn('Socket incorrect format \'host:port\'');
        process.exit(3);
      }
      console.log('- Read from socket %s', this.config.socket);
      if (this.config.encryption) {
        console.log(' - Decryption is enabled');
      }
      this.reader.startWithSocket(parts[0], parseInt(parts[1], 10));
    } else {
      console.warn('Port or socket required');
      process.exit(2);
    }
    if (this.config.solar) {
      this.solar = new ModbusSolarInput(this.config.solar.host, this.config.solar.port, this.config.solar.interval);
      // this.reader.addSolarInput(this.solar);
    }

    this.addDefaultOutputs();
    this.configureOutputs();
  }

  async stop(): Promise<void> {
    if (this.solar) {
      this.solar.close();
    }
    await Promise.all(this.outputs.map((output) => output.close())).catch((err) => {
      console.warn(err);
    });
    await this.reader.close();
    process.exit();
  }

  private addDefaultOutputs(): void {
    if (this.config.outputs.debug) {
      console.log('- Output: debug');
      this.outputs.push(new DebugOutput());
    }

    if (this.config.outputs.influx) {
      console.log('- Output: InfluxDB to %s', this.config.outputs.influx.url);
      this.outputs.push(new InfluxOutput(this.config.outputs.influx));
    }

    if (this.config.outputs.jsonSocket) {
      console.log(`- Output: JSON TCP socket on port ${this.config.outputs.jsonSocket}`);
      this.outputs.push(new TcpOutput(this.config.outputs.jsonSocket, false, true));
    }

    if (this.config.outputs.mqtt) {
      console.log('- Output: Mqtt to %s', this.config.outputs.mqtt.url);
      this.outputs.push(new MqttOutput(this.config.outputs.mqtt));
    }

    if (this.config.outputs.post) {
      console.log('- Output: Post data to %s every %d sec.', this.config.outputs.post.url, this.config.outputs.post.interval);
      this.outputs.push(new HttpOutput(this.config.outputs.post));
    }

    if (this.config.outputs.rawSocket) {
      console.log(`- Output: Raw TCP socket on port ${this.config.outputs.rawSocket}`);
      this.outputs.push(new TcpOutput(this.config.outputs.rawSocket, true, true));
    }

    if (this.config.outputs.webserver) {
      console.log('- Output: Webserver on port %d', this.config.outputs.webserver);
      this.outputs.push(new WebServer(this.config.outputs.webserver, true));
    }
  }

  private configureOutputs(): void {
    if (this.outputs.length === 0) {
      console.warn('No outputs enabled, you should enable at least one.');
      process.exit(5);
    } else {
      this.reader.startParsing();
      this.outputs.forEach((output) => {
        output.start(this.reader);
        if (this.solar) {
          output.addSolar(this.solar);
        }
      });
    }
  }

  /**
   * Push additional outputs before calling start
   * @param { Output } output An object that implements the Output interface
   */
  public addOutput(output: Output): void {
    this.outputs.push(output);
  }
}
