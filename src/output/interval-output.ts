import P1Reader from '../p1-reader';
import { Output } from './output';
import P1ReaderEvents from '../p1-reader-events';

export class IntervalOutput extends Output {
  private timer?: NodeJS.Timeout;

  private publishNextEvent: boolean;

  private interval?: number;

  constructor(interval?: number) {
    super();
    this.publishNextEvent = true;
    this.interval = interval ?? 60;
  }

  start(p1Reader: P1Reader) {
    if (p1Reader === undefined) throw new Error('p1Reader is undefined!');


    p1Reader.on(P1ReaderEvents.ParsedResult, (result) => {
      if (this.publishNextEvent) {
        this.emit(P1ReaderEvents.ParsedResult, result);
        this.publishNextEvent = false;
      }
    });
    p1Reader.on(P1ReaderEvents.UsageChanged, (result) => {
      this.emit(P1ReaderEvents.UsageChanged);
    });

    this.timer = setInterval(() => {
      this.publishNextEvent = true;
    }, (this.interval ?? 60) * 1000);
  }

  close(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
    }
    return Promise.resolve();
  }
}
