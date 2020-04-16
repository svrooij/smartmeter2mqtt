#!/usr/bin/env node

import P1Reader from './p1-reader';
import { ConfigLoader } from './config';
import Output from './output/output';
import WebServer from './output/web-server';
import TcpOutput from './output/tcp-output';
import MqttOutput from './output/mqtt-output';
import HttpOutput from './output/http-output';
import DebugOutput from './output/debug-output';

class Smartmeter {
  private reader: P1Reader;

  private outputs: Array<Output> = [];

  private config = ConfigLoader.Load();

  constructor() {
    this.reader = new P1Reader();
    console.clear();
    console.log('----------------------------------------');
    console.log('- Smartmeter2mqtt by Stephan van Rooij -');
    console.log('- Press CTRL+C to close                -');
    console.log('----------------------------------------');
  }

  start(): void {
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
      this.reader.startWithSocket(parts[0], parseInt(parts[1], 10));
    } else {
      console.warn('Port or socket required');
      process.exit(2);
    }
    this.startOutputs();
  }

  async stop(): Promise<void> {
    await Promise.all(this.outputs.map((output) => output.close())).catch((err) => {
      console.warn(err);
    });
    await this.reader.close();
    process.exit();
  }

  private startOutputs(): void {
    if (this.config.outputs.debug) {
      console.log('- Output: debug');
      this.outputs.push(new DebugOutput());
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

    if (this.outputs.length === 0) {
      console.warn('No outputs enabled, you should enable at least one.');
      process.exit(5);
    } else {
      this.reader.startParsing();
      this.outputs.forEach((output) => {
        output.start(this.reader);
      });
    }
  }
}

const smartmeter = new Smartmeter();
smartmeter.start();

process.on('SIGINT', async () => {
  console.log('Exiting....');
  await smartmeter.stop();
});
