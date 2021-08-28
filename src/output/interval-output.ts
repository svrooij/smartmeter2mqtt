import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter';
import P1Reader, { Usage } from '../p1-reader';
import { Output } from './output';
import DsmrMessage from '../dsmr-message';
import BaseSolarReader from '../solar/base-solar-input';


interface IntervalOutputEvents {
  dsmr: (result: DsmrMessage) => void;
  gasUsage: (usage: Usage) => void;
  usage: (usage: Usage) => void;
}

export default abstract class IntervalOutput extends (EventEmitter as new () => TypedEmitter<IntervalOutputEvents>) implements Output {
  private timer?: NodeJS.Timeout;

  private publishNextEvent: boolean;

  private interval?: number;

  constructor(interval?: number) {
    super();
    this.publishNextEvent = true;
    this.interval = interval ?? 60;
  }

  start(p1Reader: P1Reader): void {
    if (p1Reader === undefined) throw new Error('p1Reader is undefined!');


    p1Reader.on('dsmr', (result) => {
      if (this.publishNextEvent) {
        this.emit('dsmr', result);
        this.publishNextEvent = false;
      }
    });
    p1Reader.on('usage', (result) => {
      this.emit('usage', result);
    });
    p1Reader.on('gasUsage', (result) => {
      this.emit('gasUsage', result);
    });

    this.timer = setInterval(() => {
      this.publishNextEvent = true;
    }, (this.interval ?? 60) * 1000);
  }

  addSolar(solarReader: BaseSolarReader): void {}

  close(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
    }
    return Promise.resolve();
  }
}
