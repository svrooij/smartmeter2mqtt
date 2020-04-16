import P1Reader from '../p1-reader';
import Output from './output';
import P1ReaderEvents from '../p1-reader-events';


/**
 * DebugOutput is a sample output.
 * You'll have to at least implement the 'start(p1Reader)' method.
 * It will receive the P1Reader and in the start method,
 * you can start listening to events from the reader.
 * You should also implement the 'stop()' method to stop any started server.
 */
export default class DebugOutput extends Output {
  start(p1Reader: P1Reader): void {
    p1Reader.on(P1ReaderEvents.ParsedResult, (result) => {
      console.log(' - new reading %s', JSON.stringify(result, null, 2));
    });
    p1Reader.on(P1ReaderEvents.UsageChanged, (result) => {
      console.log(' - usageChange %s', result.message);
    });
    p1Reader.on(P1ReaderEvents.ErrorMessage, (message) => {
      console.log(' - errorMessage %s', message);
    });
  }

  close(): Promise<void> {
    console.log('Stop all servers from this output here.');
    return Promise.resolve();
  }
}

module.exports = DebugOutput;
