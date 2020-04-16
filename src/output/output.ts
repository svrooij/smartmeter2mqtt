import { EventEmitter } from 'events';
import P1Reader from '../p1-reader';
/**
 * Base Output class, extend this class to create a new output.
 */
export class Output extends EventEmitter {
  /**
   * You can override the constructor, but this makes sure you can never create a new instance of 'Output'
   */
  constructor() {
    super();
    if (this.constructor === Output) {
      throw new Error("Abstract classes can't be instantiated.");
    }
  }

  /**
   * start is the entry point of any new output.
   * @param {P1Reader} p1Reader This will be the instance of the P1Reader, use it to listen for events.
   */
  public start(p1Reader: P1Reader) {
    throw new Error('Method start(p1Reader) should be implemented');
  }

  /**
   * close is where you would close your output, it needed.
   */
  async close() { }
}

module.exports = Output;
