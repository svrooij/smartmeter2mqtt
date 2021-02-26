---
layout: default
title: TCP Socket
parent: Outputs
---

# Smartmeter2mqtt socket output

You can have this application expose several sockets. It will start a tcp socket at the specific port that will emit data as it comes in.

![Awesome illustration from undraw.co](/assets/images/undraw_data_processing_yrrv.svg)

## JSON socket

If you enable the **JSON socket** you have access to a socket that emits parsed dsmr messages as they come in. The json messages are delimited by `\r\n` so you can expect a complete json message per line. 

Sample output (formatted for easier reading):

```json
{
  "crc": true,
  "header": "KFM5KAIFA-METER",
  "p1Version": "42",
  "powerTs": "2021-02-26T12:15:24",
  "powerSn": "45303xxx",
  "totalT1Use": 5000.700,
  "totalT2Use": 2000.000,
  "totalT1Delivered": 2000.500,
  "totalT2Delivered": 5000.600,
  "currentTarrif": 2,
  "currentUsage": 0,
  "currentDelivery": 1.184,
  "powerFailures": 0,
  "longPowerFailures": 0,
  "voltageSagsL1": 0,
  "voltageSwellsL1": 0,
  "currentL1": 5,
  "currentUsageL1": 0,
  "currentDeliveryL1": 1.189,
  "deviceType": "003",
  "gasSn": "473030xxx",
  "gas": {
    "ts": "2021-02-26T12:00:00",
    "totalUse": 2000.3
  },
  "calculatedUsage": -1184,
  "solarProduction": 1571.3,
  "houseUsage": 387
}
```

Connect with telnet:

```bash
> telnet 192.168.1.20 3010
Trying 192.168.1.20...
Connected to black-pearl.localdomain.
Escape character is '^]'.
{"header":"KFM5KAIFA-METER","p1Version":"42","powerTs":"2020-04-10T10:20:23","powerSn":"45303032xxx","totalT1Use":3000.497,"totalT2Use":1000.243,"totalT1Delivered":1000.458,"totalT2Delivered":3000.394,"currentTarrif":2,"currentUsage":0.049,"currentL1":2,"currentUsageL1":0.049,"deviceType":"003","gasSn":"4730303xxx","gas":{"ts":"2020-04-10T10:00:00","totalUse":2000.671},"crc":true,"calculatedUsage":49}
{"header":"KFM5KAIFA-METER","p1Version":"42","powerTs":"2020-04-10T10:20:33","powerSn":"45303032xxx","totalT1Use":3000.497,"totalT2Use":1000.243,"totalT1Delivered":1000.458,"totalT2Delivered":3000.394,"currentTarrif":2,"currentUsage":0.048,"currentL1":2,"currentUsageL1":0.048,"deviceType":"003","gasSn":"4730303xxx","gas":{"ts":"2020-04-10T10:00:00","totalUse":2000.671},"crc":true,"calculatedUsage":48}
```

## Raw socket

If you enable the raw socket, you will have access to the DSMR messages as they come in. You can use this if you want to connect other applications to the one connection you have with the smartmeter. This can also be used in combination with decrypting, that means you can have this app decrypt the data from some smartmeters and forward it unencrypted to an other application.

```text
/KFM5KAIFA-METER

1-3:0.2.8(42)
0-0:1.0.0(190514213620S)
0-0:96.1.1(453xxxxxxxxxx)
1-0:1.8.1(002000.123*kWh)
1-0:1.8.2(001000.456*kWh)
1-0:2.8.1(001000.456*kWh)
1-0:2.8.2(002000.789*kWh)
0-0:96.14.0(0001)
1-0:1.7.0(00.329*kW)
1-0:2.7.0(00.000*kW)
0-0:96.7.21(00000)
0-0:96.7.9(00000)
1-0:99.97.0(1)(0-0:96.7.19)(000101000001W)(2147483647*s)
1-0:32.32.0(00000)
1-0:32.36.0(00000)
0-0:96.13.1()
0-0:96.13.0()
1-0:31.7.0(002*A)
1-0:21.7.0(00.329*kW)
1-0:22.7.0(00.000*kW)
0-2:24.1.0(003)
0-2:96.1.0(473xxx)
0-2:24.2.1(190514210000S)(01543.012*m3)
!588F
```

## Connect in windows

You can see the output of these sockets in windows by starting a terminal and executing the following command:

```bash
telnet 127.0.0.1 port

# if you get an error that you dont have telnet Windows + R and type
pkgmgr /iu:"TelnetClient"
```
