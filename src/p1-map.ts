import { GasValue } from "./gas-value";
import DataPoint from "./datapoint";

interface P1MapItem {
  id: string;
  name: string;
  valueRetriever?(values?: Array<string>): string | number | GasValue | undefined
}

export default class P1Map {
  private constructor() {}

  public static parseLine(line: string): DataPoint | undefined {
    if (line && line.length > 0) {
      const identifier = line.substr(0, line.indexOf('('))
      const values = P1Map.stringsInBrackets(line)
      const result = { id: identifier, rawValues: values } as DataPoint;
      const mapping = P1Map.mapping.find(m => {
        return m.id === identifier
      })
      if (mapping) {
        result.name = mapping.name
        if (mapping.valueRetriever) {
          result.value = mapping.valueRetriever(values)
          delete result.rawValues
        }
      }
      return result
    }
    return undefined;
  }

  private static stringsInBrackets (line: string): Array<string> | undefined {
    var matches = line.match(/\((.*?)\)/g)
    if (matches) {
      return matches.map(value => { return value.replace(/[()]/g, '') })
    }
    return undefined
  }

  private static getFirstString(values?: Array<string>): string | undefined {
    if(values)
      return values[0];
    return undefined;
  }

  private static parseFirstFloat(values?: Array<string>): number | undefined {
    return P1Map.parseFloat(P1Map.getFirstString(values))
  }

  private static parseFloat(input?: string): number | undefined {
    if(input === undefined) {
      return undefined;
    }
    const parsableValue = input.substr(0, input.indexOf('*'))
    return parseFloat(parsableValue)
  }

  private static parseFirstInt(values?: Array<string>): number {
    return parseInt(P1Map.getFirstString(values) ?? '0', 10)
  }

  private static parseFirstTimestamp(values?: Array<string>): string | undefined {
    return P1Map.parseTimestamp(P1Map.getFirstString(values));
  }

  private static parseTimestamp(value?: string): string | undefined {
    if(value === undefined) { return undefined; }

    const parts = value.match(/.{1,2}/g)
    if(parts === null) { return undefined; }
    const dateString = `20${parts[0]}-${parts[1]}-${parts[2]}T${parts[3]}:${parts[4]}:${parts[5]}`
    return dateString
  }

  private static parseGasValue(values?: Array<string>): GasValue | undefined {
    if(values !== undefined && values.length >= 2) {
      return {
        ts: P1Map.parseTimestamp(values[0]),
        totalUse: P1Map.parseFloat(values[1])
      }
    }
    return undefined;
  }

  private static readonly mapping: Array<P1MapItem> = [
    { id: '1-3:0.2.8', name: 'p1Version', valueRetriever: P1Map.getFirstString },
    { id: '0-0:1.0.0', name: 'powerTs', valueRetriever: P1Map.parseFirstTimestamp },
    { id: '0-0:96.1.1', name: 'powerSn', valueRetriever: P1Map.getFirstString },
    { id: '1-0:1.8.1', name: 'totalT1Use', valueRetriever: P1Map.parseFirstFloat },
    { id: '1-0:1.8.2', name: 'totalT2Use', valueRetriever: P1Map.parseFirstFloat },
    { id: '1-0:2.8.1', name: 'totalT1Delivered', valueRetriever: P1Map.parseFirstFloat },
    { id: '1-0:2.8.2', name: 'totalT2Delivered', valueRetriever: P1Map.parseFirstFloat },
    { id: '0-0:96.14.0', name: 'currentTarrif', valueRetriever: P1Map.parseFirstInt },
    { id: '1-0:1.7.0', name: 'currentUsage', valueRetriever: P1Map.parseFirstFloat },
    { id: '1-0:2.7.0', name: 'currentDelivery', valueRetriever: P1Map.parseFirstFloat },
    { id: '0-0:96.7.21', name: 'powerFailures', valueRetriever: P1Map.parseFirstInt },
    { id: '0-0:96.7.9', name: 'longPowerFailures', valueRetriever: P1Map.parseFirstInt },
    { id: '1-0:32.32.0', name: 'voltageSagsL1', valueRetriever: P1Map.parseFirstInt },
    { id: '1-0:52.32.0', name: 'voltageSagsL2', valueRetriever: P1Map.parseFirstInt },
    { id: '1-0:72.32.0', name: 'voltageSagsL3', valueRetriever: P1Map.parseFirstInt },
    { id: '1-0:32.36.0', name: 'voltageSwellsL1', valueRetriever: P1Map.parseFirstInt },
    { id: '1-0:52.36.0', name: 'voltageSwellsL2', valueRetriever: P1Map.parseFirstInt },
    { id: '1-0:72.36.0', name: 'voltageSwellsL3', valueRetriever: P1Map.parseFirstInt },
    { id: '1-0:31.7.0', name: 'currentL1', valueRetriever: P1Map.parseFirstFloat },
    { id: '1-0:51.7.0', name: 'currentL2', valueRetriever: P1Map.parseFirstFloat },
    { id: '1-0:71.7.0', name: 'currentL3', valueRetriever: P1Map.parseFirstFloat },
    { id: '1-0:21.7.0', name: 'currentUsageL1', valueRetriever: P1Map.parseFirstFloat },
    { id: '1-0:41.7.0', name: 'currentUsageL2', valueRetriever: P1Map.parseFirstFloat },
    { id: '1-0:61.7.0', name: 'currentUsageL3', valueRetriever: P1Map.parseFirstFloat },
    { id: '1-0:22.7.0', name: 'currentDeliveryL1', valueRetriever: P1Map.parseFirstFloat },
    { id: '1-0:42.7.0', name: 'currentDeliveryL2', valueRetriever: P1Map.parseFirstFloat },
    { id: '1-0:62.7.0', name: 'currentDeliveryL3', valueRetriever: P1Map.parseFirstFloat },
    { id: '0-2:24.1.0', name: 'deviceType', valueRetriever: P1Map.getFirstString },
    { id: '0-2:96.1.0', name: 'gasSn', valueRetriever: P1Map.getFirstString },
    { id: '0-2:24.2.1', name: 'gas', valueRetriever: P1Map.parseGasValue }
  ] as Array<P1MapItem>;
}