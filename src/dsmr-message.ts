import { GasValue } from "./gas-value";

interface DsmrMessageBase {
  crc: boolean;
  gas?: GasValue;
}

export default interface DsmrMessage extends DsmrMessageBase {

  [key: string]: string | number | Array<string> | GasValue | boolean | undefined
}