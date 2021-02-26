---
layout: default
title: Solar input
parent: Advanced
---

# Solar input

To make this app even more accurate, you can als have it load data from your solar panel invertor.

This library can also read current solar production from an inverter supporting **SunSpec**. We use [@svrooij/sunspec](https://github.com/svrooij/sunspec) for this, see other package for more info.

By reading data from the solar panel as well, the properties `houseUsage` and `solarProduction` will become available. The first one is computed as follows `solarProduction + calculatedUsage` if you're producing 1000 watt and the calculatedUsage is -400 (delivering 400 watt), the houseUsage must be 600 watt.

![Screenshot of smartmeter2mqtt web page](/assets/images/screenshot_web-with-solar.png)

## SolarEdge

SolarEdge invertors support the [SunSpec](https://www.solaredge.com/sites/default/files/sunspec-implementation-technical-note.pdf). That means you can turn on modbus over tcp on the inverter. You need to turn it on **and connect within 120 seconds**. After that modbus over tcp will stay on until you turn it off.

Turn on reading data from this modbus port by starting this app with the argument `--sunspec-modbus` for the IP and optional `--sunspec-modbus-port` to specify the port (defaults to `502`).

## Webserver

After you enable solar input the webserver page will also show the **Solar Production** and the **House Usage**. And there will be an extra endpoint available `http(s)://ip:port/api/solar` with the following output:

```json
{
  "manufacturer": "SolarEdge",
  "model": "SE3680",
  "version": "0003.2186",
  "serial": "xxx",
  "did": 101,
  "lifetimeProduction": 11366553,
  "temperature": 45.26,
  "status": 4,
  "acTotalCurrent": 10.8,
  "acPower": 2523,
  "acFrequency": 50.03,
  "apparentPower": 2530.9,
  "reactivePower": 199.85,
  "powerFactor": 99.68,
  "dcCurrent": 6.854,
  "dcVoltage": 373.7,
  "dcPower": 2561.4
}
```

## Mqtt

The solar data will also be available in the [mqtt](/outputs/mqtt.html) output.

## Developer notes

The [modbus-solar-input](https://github.com/svrooij/smartmeter2mqtt/blob/master/src/modbus-solar-input.ts) is responsible for loading the data from this invertor. Creating an additional solar input should be easy.
