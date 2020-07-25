export default class P1ReaderEvents {
  /** Error messages */
  static get ErrorMessage(): string { return 'errorMessage'; }

  /** A line is emitted as the data comes in. */
  static get Line(): string { return 'line'; }

  /** A Parsed result is emitted as it is parsed (and the crc checks out). */
  static get ParsedResult(): string { return 'dsrm'; }

  /** As the last line of the message is received it is emits the entire message as raw. */
  static get Raw(): string { return 'raw'; }

  /** Usage change is emitted after the parsed result. It keeps the last result to compare. */
  static get UsageChanged(): string { return 'usageChanged'; }
  
  static get GasUsageChanged(): string { return 'gasUsageChanged'; }
  
  static get SolarResult(): string { return 'solar'; }
}
