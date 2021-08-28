import P1Reader from '../p1-reader';
import BaseSolarReader from '../solar/base-solar-input';

/**
 * Base Output class, implement this interface to create a new output.
 */
export interface Output {

  /**
   * start is the entry point of any new output.
   * @param {P1Reader} p1Reader This will be the instance of the P1Reader, use it to listen for events.
   */
  start(p1Reader: P1Reader): void;

  addSolar(solarReader: BaseSolarReader): void;

  /**
   * close is where you would close your output, it needed.
   */
  close(): Promise<void>;
}
