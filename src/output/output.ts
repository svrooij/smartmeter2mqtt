const EventEmitter = require('events')
/**
 * Base Output class, extend this class to create a new output.
 */
class Output extends EventEmitter {
  /**
   * You can override the constructor, but this makes sure you can never create a new instance of 'Output'
   */
  constructor () {
    super()
    if (this.constructor === Output) {
      throw new Error("Abstract classes can't be instantiated.")
    }
  }

  /**
   * start is the entry point of any new output.
   * @param {P1Reader} p1Reader This will be the instance of the P1Reader, use it to listen for events.
   * @param {Object} options Any options you need passed to your output.
   */
  start (p1Reader, options = {}) {
    throw new Error('Method start(p1Reader, options) should be implemented')
  }

  /**
   * close is where you would close your output, it needed.
   */
  async close () { }
}

module.exports = Output
