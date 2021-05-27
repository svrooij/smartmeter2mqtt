import P1Reader from '../p1-reader';
import { Output } from './output';

/**
 * DebugOutput is a sample output.
 * You'll have to at least implement the 'start(p1Reader)' method.
 * It will receive the P1Reader and in the start method,
 * you can start listening to events from the reader.
 * You should also implement the 'stop()' method to stop any started server.
 */
export default class DebugOutput implements Output {
  start(p1Reader: P1Reader): void {
    p1Reader.on('dsmr', (result) => {
      console.log(' - new reading %s', JSON.stringify(result, null, 2));
    });
    p1Reader.on('usage', (result) => {
      console.log(' - usageChange %s', result.message);
    });
    p1Reader.on('gasUsage', (result) => {
      console.log(' - gasUsageChange %s', result.message);
    });
    p1Reader.on('errorMessage', (message) => {
      console.log(' - errorMessage %s', message);
    });
  }

  close(): Promise<void> {
    // You should stop the started servers here, when building your own output.
    return Promise.resolve();
  }
}
