import { GasValue } from './gas-value';

export default interface DataPoint {
  id: string;
  name?: string;
  value?: string | number | GasValue;
  rawValues?: Array<string>;
}
