const getFirstString = function (values) {
  if (values) return values[0]
  return null
}
const customParseFloat = function (input) {
  const value = input.substr(0, input.indexOf('*'))
  return parseFloat(value)
}
const parseFirstFloat = function (values) {
  if (values) {
    return customParseFloat(values[0])
  }
}
const parseFirstInt = function (values) {
  if (values) {
    return parseInt(values[0])
  }
}
const parseTimestamp = function (value) {
  const parts = value.match(/.{1,2}/g)
  const dateString = `20${parts[0]}-${parts[1]}-${parts[2]}T${parts[3]}:${parts[4]}:${parts[5]}`
  return dateString
}
const parseFirstTimestamp = function (values) {
  return parseTimestamp(values[0])
}
const parseGasValue = function (values) {
  return { ts: parseTimestamp(values[0]), totalUse: customParseFloat(values[1]) }
}
const P1Map = [
  { id: '1-3:0.2.8', name: 'p1Version', valueRetriever: getFirstString },
  { id: '0-0:1.0.0', name: 'powerTs', valueRetriever: parseFirstTimestamp },
  { id: '0-0:96.1.1', name: 'powerSn', valueRetriever: getFirstString },
  { id: '1-0:1.8.1', name: 'totalT1Use', valueRetriever: parseFirstFloat },
  { id: '1-0:1.8.2', name: 'totalT2Use', valueRetriever: parseFirstFloat },
  { id: '1-0:2.8.1', name: 'totalT1Delivered', valueRetriever: parseFirstFloat },
  { id: '1-0:2.8.2', name: 'totalT2Delivered', valueRetriever: parseFirstFloat },
  { id: '0-0:96.14.0', name: 'currentTarrif', valueRetriever: parseFirstInt },
  { id: '1-0:1.7.0', name: 'currentUsage', valueRetriever: parseFirstFloat },
  { id: '1-0:2.7.0', name: 'currentDelivery', valueRetriever: parseFirstFloat },
  { id: '0-0:96.7.21', name: 'powerFailures', valueRetriever: parseFirstInt },
  { id: '0-0:96.7.9', name: 'longPowerFailures', valueRetriever: parseFirstInt },
  { id: '1-0:32.32.0', name: 'voltageSagsL1', valueRetriever: parseFirstInt },
  { id: '1-0:32.36.0', name: 'voltageSwellsL1', valueRetriever: parseFirstInt },
  { id: '1-0:31.7.0', name: 'currentCurrentL1', valueRetriever: parseFirstInt },
  { id: '1-0:21.7.0', name: 'currentUsageL1', valueRetriever: parseFirstFloat },
  { id: '1-0:22.7.0', name: 'currentDeliveryL1', valueRetriever: parseFirstFloat },
  { id: '0-2:24.1.0', name: 'deviceType', valueRetriever: getFirstString },
  { id: '0-2:96.1.0', name: 'gasSn', valueRetriever: getFirstString },
  { id: '0-2:24.2.1', name: 'gas', valueRetriever: parseGasValue }
]

module.exports = P1Map
