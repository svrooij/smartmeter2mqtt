import GasValue from './gas-value';

/**
 * Properties in this base class are used by some outputs.
 * By defining them here we set the type instead of all possible types.
 *
 * @interface DsmrMessageBase
 */
interface DsmrMessageBase {
  /**
   * CRC checks out in message
   *
   * @type {boolean}
   * @memberof DsmrMessageBase
   */
  crc: boolean;
  /**
   * Current amount of watt being delivered
   *
   * @type {number}
   * @memberof DsmrMessageBase
   */
  currentDelivery?: number;
  /**
   * Current Tarrif (1 = cheap / nighttime, 2 = not cheap / daytime)
   *
   * @type {number}
   * @memberof DsmrMessageBase
   */
  currentTarrif?: number;
  /**
   * Current amount of watt being used
   *
   * @type {number}
   * @memberof DsmrMessageBase
   */
  currentUsage?: number;
  /**
   * Gas meter reading
   *
   * @type {GasValue}
   * @memberof DsmrMessageBase
   */
  gas?: GasValue;
  /**
   * Gas meter serial number
   *
   * @type {string}
   * @memberof DsmrMessageBase
   */
  gasSn?: string;
  /**
   * Power meter serial number
   *
   * @type {string}
   * @memberof DsmrMessageBase
   */
  powerSn?: string;
  /**
   * Last reading from power meter
   *
   * @type {string}
   * @memberof DsmrMessageBase
   */
  powerTs?: string;
  /**
   * Total amount of kwh delivered during nighttime
   *
   * @type {number}
   * @memberof DsmrMessageBase
   */
  totalT1Delivered?: number;
  /**
   * Total amount of kwh used during nighttime
   *
   * @type {number}
   * @memberof DsmrMessageBase
   */
  totalT1Use?: number;
  /**
   * Total amount of kwh delivered during daytime
   *
   * @type {number}
   * @memberof DsmrMessageBase
   */
  totalT2Delivered?: number;
  /**
   * Total amount of kwh used during daytime
   *
   * @type {number}
   * @memberof DsmrMessageBase
   */
  totalT2Use?: number;
}

/**
 * The DsmrMessage allows for extending the result without the need to change the class (or the base)
 *
 * @export
 * @interface DsmrMessage
 * @extends {DsmrMessageBase}
 */
export default interface DsmrMessage extends DsmrMessageBase {

  [key: string]: string | number | Array<string> | GasValue | boolean | undefined;
}
