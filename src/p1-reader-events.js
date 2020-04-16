class P1ReaderEvents {
  /** Error messages */
  static get ErrorMessage () { return 'errorMessage' }
  /** A line is emitted as the data comes in. */
  static get Line () { return 'line' }
  /** A Parsed result is emitted as it is parsed (and the crc checks out). */
  static get ParsedResult () { return 'dsrm' }
  /** As the last line of the message is received it is emits the entire message as raw. */
  static get Raw () { return 'raw' }
  /** Usage change is emitted after the parsed result. It keeps the last result to compare. */
  static get UsageChanged () { return 'usageChanged' }
}

module.exports = P1ReaderEvents
