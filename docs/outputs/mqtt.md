---
layout: default
title: MQTT
parent: Outputs
---

# Smartmeter2mqtt mqtt output

This output is how it all started, if configured this app will post all the parsed data to your mqtt server.

## Topics

Once enabled mqtt, this application will send several messages to your mqtt server. All prefixed with `smartmeter` (configurable with `--mqtt-topic`).

### smartmeter/status/energy

Payload:

```json
{
  "header" : "KFM5KAIFA-METER",
  "p1Version" : "42",
  "powerTs" : "2020-04-13T18:22:59",
  "powerSn" : "453030",
  "totalT1Use" : 3000,
  "totalT2Use" : 1000,
  "totalT1Delivered" : 1000,
  "totalT2Delivered" : 3000,
  "currentTarrif" : 1,
  "currentDelivery" : 1.772,
  "currentL1" : 7,
  "currentDeliveryL1" : 1.77,
  "deviceType" : "003",
  "gasSn" : "47303",
  "gas" : {
    "ts" : "2020-04-13T18:00:00",
    "totalUse" : 2000
  },
  "crc" : true,
  "calculatedUsage" : -1772,
  "houseUsage": 400,
  "solarProduction": 2172
}
```

### smartmeter/status/usage

Payload:

```json
{
  "previousUsage" : -1746,
  "relative" : -8,
  "message" : "Usage decreased -8 to -1754",
  "val" : -1754,
  "tc" : 1586795117062
}
```

### smartmeter/status/gasUsage

Payload:

### smartmeter/status/solar

See [solar input](../advanced/solar-input.html) for more info

Payload:

## Home Assistant auto discovery

If you're running home assistant, be sure to enable mqtt discovery `--mqtt-discovery` and `--mqtt-discovery-prefix` (defaults to `homeassistant`). This will make sure the following sensors will automatically show up in home assistant:

- **Current usage**: Your current total usage (can be negative when delivering power)
- **Total used T1**: Total power consumed from the grid in T1
- **Total used T2**: Total power consumed from the grid in T2
- **Total delivered T1**: Total power delivered to the grid in T1
- **Total delivered T2**: Total power delivered to the grid in T2
