# Smartmeter2mqtt

[![npm](https://img.shields.io/npm/v/smartmeter2mqtt.svg?style=flat-square)](https://www.npmjs.com/package/smartmeter2mqtt)
[![travis](https://img.shields.io/travis/svrooij/smartmeter2mqtt.svg?style=flat-square)](https://travis-ci.org/svrooij/smartmeter2mqtt)
[![mqtt-smarthome](https://img.shields.io/badge/mqtt-smarthome-blue.svg?style=flat-square)](https://github.com/mqtt-smarthome/mqtt-smarthome)
[![Support me on Github][badge_sponsor]][link_sponsor]
[![PayPal][badge_paypal_donate]][paypal-donations]
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)

This application can listen to your (Dutch) Smartmeter with a P1 connector, and send the data to several outputs. Currently supporting the following methods:

- JSON TCP socket
- Raw TCP socket
- Website with websockets (and ajax fallback) for client side refresh
- Http json endpoint to get the latest reading
- Webrequest to external service
- MQTT (with home assistant integration)

Supporting other services like some website where you can monitor historic data is also possible. [Building your own output](#support-for-output-x) is explained a bit lower on this page.

## Getting started

1. Connect smartmeter
2. Choose the run method [docker](#running-in-docker) or [bare](#running-locally)
3. Start the application (for testing)
4. Run in background using docker container or [PM2](https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/#start-an-app)
5. Send out a tweet that you are using smartmeter2mqtt on [twitter @svrooij](https://twitter.com/svrooij)

### Running in docker

My setup is a Raspberry Pi 3 model b rev 1.2 (See `cat /proc/cpuinfo`) with a [P1 cable](#p1-cable) running [Hypriot](https://blog.hypriot.com/downloads/) as an OS (because of the pre-configured docker/docker-compose).

The [docker image](https://hub.docker.com/r/svrooij/smartmeter) is currently automatically build from every new release. We support the following platforms (can be extended if we have someone willing to test it out):

- AMD64 `linux/amd64`
- ARM v6 (raspberry pi ?) `linux/arm/v6`
- ARM v7 (raspberry pi 3/3b) `linux/arm/v7`
- ARM64 (raspberry pi 4 running in 64 bit) `linux/arm64`

#### Find device ID

If you're reading from an USB to P1 cable, it's important that you connect the device to the container.
The mapped location might change on reboot or if you connect other devices. That is why I recommend to connect the device by serial.
You will need the real device location, type `ls /dev/serial/by-id` and not the device string that looks like `usb-FTDI_FT232R_USB_UART_A13LN4ZS-if00-port0` for my [cable](#p1-cable).

Be sure to replace this serial in the docker compose file.

#### Docker compose

```yaml
version: "3.7"

services:
  smartmeter:
    image: svrooij/smartmeter:alpha
    devices: # Replace the device id with your found id, the device is mapped as /dev/ttyUSB0 inside the container.
      - /dev/serial/by-id/usb-FTDI_FT232R_USB_UART_A13LN4ZS-if00-port0:/dev/ttyUSB0
    restart: unless-stopped
    ports: # Depending on your situation you'll need to expose some ports
      - 3000:3000
      - 3010:3010
      - 3020:3020
    environment:
      - TZ=Europe/Amsterdam
      - SMARTMETER_PORT=/dev/ttyUSB0
      - SMARTMETER_web-server=3000
      - SMARTMETER_tcp-server=3010
      - SMARTMETER_raw-tcp-server=3020

```

You can set every setting with an environment variable prefixed with `SMARTMETER_`, choose the settings you need.

### Running locally

1. Install `npm i -g smartmeter2mqtt --production`
2. Figure out what source you want to connect, see below.
3. Start application to see if it works
4. Configure to run in background [see stackoverflow answer](https://stackoverflow.com/a/29042953/639153).

## Usage

```bash
smartmeter2mqtt 0.0.0-dev
Publish data from your Smartmeter with a P1 interface to your MQTT server.

Read from P1 to USB serial:
smartmeter2mqtt --port /dev/ttyUSB0 [options]

Read from tcp socket:
smartmeter2mqtt --socket host:port [options]

Options:
  --port            The serial port to read, P1 to serial usb, eg.
                    '/dev/ttyUSB0'
  --socket          The tcp socket to read, if reading from serial to network
                    device, as host:port, like '192.168.0.3:3000'
  --web-server      Expose webserver on this port                       [number]
  --post-url        Post the results to this url
  --post-interval   Seconds between posts                [number] [default: 300]
  --post-json       Post the data as json instead of form parameters   [boolean]
  --mqtt-url        Send the data to this mqtt server
  --mqtt-topic      Use this topic prefix for all messages
                                                         [default: "smartmeter"]
  --mqtt-distinct   Publish data distinct to mqtt                      [boolean]
  --tcp-server      Expose JSON TCP socket on this port                 [number]
  --raw-tcp-server  Expose RAW TCP socket on this port                  [number]
  --debug           Enable debug output                                [boolean]
  --version         Show version number                                [boolean]
  -h, --help        Show help                                          [boolean]

All options can also be specified as Environment valiables
Prefix them with 'SMARTMETER_' and make them all uppercase
```

## Inputs

This application supports two inputs, you'll need either one.

### P1 cable

For a **direct connection** you'll need a Smartmeter cable like [this one at sossolutions](https://www.sossolutions.nl/slimme-meter-kabel?referal=svrooij), and connect it to a free usb port on the device reading the meter. I've been using this cable for years without any problems.

### TCP socket

You can also connect to a **TCP socket**, this way you don't need the device running this program to be on a device near your meter. You can also check out this [ESP8266 P1 reader](http://www.esp8266thingies.nl/wp/), it creates a TCP socket for your meter.

## Outputs

This application supports multiple (concurrent) outputs. Enable at least one!

### Output -> Webserver

You can enable the webserver. This will enable you to see a simple webpage with the latest data from your smartmeter (PR with styling appreciated!). It will also enable an endpoint that responds with json with all the available data. Start this output with `--web-server [port]`, and the webpage will be available on `http://[ip-of-server]:[port]/` and the json endpoint will be avaiable on `http://[ip-of-server]:[port]/api/reading`.

This webpage uses WebSockets for automatic server side data refresh. So the browser will show the latest data as it comes in. If your browser doesn't support websockets it should fallback on ajax loading.

![Screenshot of web interface](./screenshots/screenshot_web.png "Web interface demo")

### Output -> JSON tcp socket

This output creates a tcp socket where you will receive a newline delimeted json stream, to be used in your other applications.
Start it with the `--tcp-server [portnumer]` parameter. You can then see immediate result when you connect too it with for instance telnet `telnet [ip-of-server] [specified-port]`. Maximum 3 connections.

```plain
> telnet 192.168.1.20 3010
Trying 192.168.1.20...
Connected to black-pearl.localdomain.
Escape character is '^]'.
{"header":"KFM5KAIFA-METER","p1Version":"42","powerTs":"2020-04-10T10:20:23","powerSn":"45303032xxx","totalT1Use":3000.497,"totalT2Use":1000.243,"totalT1Delivered":1000.458,"totalT2Delivered":3000.394,"currentTarrif":2,"currentUsage":0.049,"currentL1":2,"currentUsageL1":0.049,"deviceType":"003","gasSn":"4730303xxx","gas":{"ts":"2020-04-10T10:00:00","totalUse":2000.671},"crc":true,"calculatedUsage":49}
{"header":"KFM5KAIFA-METER","p1Version":"42","powerTs":"2020-04-10T10:20:33","powerSn":"45303032xxx","totalT1Use":3000.497,"totalT2Use":1000.243,"totalT1Delivered":1000.458,"totalT2Delivered":3000.394,"currentTarrif":2,"currentUsage":0.048,"currentL1":2,"currentUsageL1":0.048,"deviceType":"003","gasSn":"4730303xxx","gas":{"ts":"2020-04-10T10:00:00","totalUse":2000.671},"crc":true,"calculatedUsage":48}
```

### Output -> Raw tcp socket

This output creates a tcp socket where you'll receive the raw data as it comes in. This is usefull if you want to debug the data coming in and don't want to restart your smartmeter2mqtt application all the time. This can in turn be used as an TCP socket input. Start it with `--raw-tcp-server [port]`. Maximum 3 connections.

Conect to it with `telnet [ip-of-server] [specified-port]` and see the data coming in on your windows machine.

This socket can also be used in domoticz as **P1-Wifi Gateway**.

```plain
> telnet 192.168.1.20 3020
Trying 192.168.1.20...
Connected to black-pearl.localdomain.
Escape character is '^]'.
/KFM5KAIFA-METER

1-3:0.2.8(42)
0-0:1.0.0(200410102433S)
0-0:96.1.1(4530xxx)
1-0:1.8.1(003000.497*kWh)
1-0:1.8.2(001000.248*kWh)
1-0:2.8.1(001000.458*kWh)
1-0:2.8.2(003000.394*kWh)
0-0:96.14.0(0002)
1-0:1.7.0(00.105*kW)
1-0:2.7.0(00.000*kW)
0-0:96.7.21(00000)
0-0:96.7.9(00000)
1-0:99.97.0(1)(0-0:96.7.19)(000101000001W)(2147483647*s)
1-0:32.32.0(00000)
1-0:32.36.0(00000)
0-0:96.13.1()
0-0:96.13.0()
1-0:31.7.0(001*A)
1-0:21.7.0(00.105*kW)
1-0:22.7.0(00.000*kW)
0-2:24.1.0(003)
0-2:96.1.0(4730xxx)
0-2:24.2.1(200410100000S)(02000.671*m3)
!5305
```

### Output -> Webrequest

This output will posts the new data to an URL, at an interval (to prevent overloading of remote). You can provide the url to post to with `--post-url [url]`.

You can also configure the interval with `--post-interval 300` (to set it to 300 seconds).

By default the data is posted as form variables, if you want you can have it post as json by specifing `--post-json`.

### Output -> MQTT

This will output the data to the specified mqtt server. You'll need to submit the mqtt url with `--mqtt-url mqtt://[host]:[port]` like `--mqtt-url mqtt://localhost:1883`.

#### Mqtt - Topics

Once enabled mqtt, this application will send several messages to your mqtt server. All prefixed with `smartmeter` (configurable with `--mqtt-topic`).

Topic: `smartmeter/status/energy`
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
  "calculatedUsage" : -1772
}
```

Topic: `smartmeter/status/usage`
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

#### MQTT - Auto discovery homeassistant

If you're running home assistant, be sure to enable mqtt discovery `--mqtt-discovery` and `--mqtt-discovery-prefix` (defaults to `homeassistant`). This will make sure the following sensors will automattically show up in home assistant:

- **Current usage**: Your current total usage (can be negative when delivering power)
- **Total used T1**: Total power consumed from the grid in T1
- **Total used T2**: Total power consumed from the grid in T2
- **Total delivered T1**: Total power delivered to the grid in T1
- **Total delivered T2**: Total power delivered to the grid in T2

## Developer section

This section is for the curious ones.

### Support for output X

This package comes with several outputs, they all extend [Output](https://github.com/svrooij/smartmeter2mqtt/blob/master/lib/output/output.js). Every new output should implement the `start(p1Reader, options)` method. They all get the instance of the current [P1Reader](https://github.com/svrooij/smartmeter2mqtt/blob/master/lib/p1-reader.js). So your new output should subscribe to one of the events. All events are defined in [P1ReaderEvents](https://github.com/svrooij/smartmeter2mqtt/blob/master/lib/p1-reader-events.js) and you should use the statics from the class, (even though they are just strings).

- **P1ReaderEvents.ParsedResult** to get the parsed result (if crc check validates), probably the one you want.
- **P1ReaderEvents.UsageChange** to get the changes in current usage. Already computed you dont have to.
- **P1ReaderEvents.Line** to get every line when they come in.
- **P1ReaderEvents.Raw** to get every raw message. Is transmitted as a complete string when the endline is received.

If you start some kind of server, be sure to also implemend the `close()` method.

Every output is wired to the input in the [index.js](https://github.com/svrooij/smartmeter2mqtt/blob/master/index.js) file in the `_startOutputs()` method. Just check how it works.

```JavaScript
const YourOutput = require('./lib/output/your-output')
let yourOutput = new YourOutput()
yourOutput.start(this._reader, { option1: true, options2: false })
this.outputs.push(yourOutput)
```

Your output will get an event every 10 seconds, if you only want daily results you will need to build some logic to skip events.

### Run tests before PR

This library enforces [Javascript Standard Style](https://standardjs.com/) on every build. In the [tests](./tests) folder are several tests defined. So we don't break any existing code. Both the javascript styles and the tests can be run with `npm run test` in the main folder.

### Build docker image

The Dockerfile is setup to support multi-architectures builds. You can build this image on you regular 64 bit computer for these platforms. `arm` / `arm64` / `amd64` by using the following command:

```bash
# For pushing to docker hub
docker buildx build -t svrooij/smartmeter:alpha --platform linux/amd64,linux/arm/v7,linux/arm64 --push .
# For loading it to your local machine
docker buildx build -t svrooij/smartmeter:alpha --platform linux/amd64,linux/arm/v7,linux/arm64 --load .
# Regular build (no buildx installed)
docker build -t svrooij/smartmeter:alpha .
```

### DSMR - P1 Sample data

My Keifa meter outputs the following data as you connect to the serial connection. Other meters should be supported as well. Else please start with `--debug` and send one full output to us.

```text
/KFM5KAIFA-METER            // Header, Manufacturer specific

1-3:0.2.8(42)               // Version information P1 output
0-0:1.0.0(190514213620S)    // Timestamp YYMMDDhhmmssX (X=S DST/W no DST)
0-0:96.1.1(453xxxxxxxxxx)   // Electricity Meter serial number
1-0:1.8.1(002000.123*kWh)   // Total used in T1
1-0:1.8.2(001000.456*kWh)   // Total used in T2
1-0:2.8.1(001000.456*kWh)   // Total delivered back in T1
1-0:2.8.2(002000.789*kWh)   // Total delivered back in T2
0-0:96.14.0(0001)           // Current Tarrif
1-0:1.7.0(00.329*kW)        // Current use in P+ (watt resolution)
1-0:2.7.0(00.000*kW)        // Current delivery in P- (watt resolution)
0-0:96.7.21(00000)          // Number of power failures in any phase
0-0:96.7.9(00000)           // Number of long power failures in any phase
1-0:99.97.0(1)(0-0:96.7.19)(000101000001W)(2147483647*s) // Long power failures log (can be multiple)
1-0:32.32.0(00000)          // Number of voltage sags in phase L1
1-0:32.36.0(00000)          // Number of voltage swells in phase L1
0-0:96.13.1()               // Text message max 1024 characters?? Undocumented
0-0:96.13.0()               // Text message max 1024 characters??
1-0:31.7.0(002*A)           // Instantaneous current L1 in A resolution.
1-0:21.7.0(00.329*kW)       // Instantaneous power L1 (P+) in watt resolution.
1-0:22.7.0(00.000*kW)       // Instantaneous active power L1 (P-) in watt resolution.
0-2:24.1.0(003)             // Device type
0-2:96.1.0(473xxx)          // Gas meter serial number
0-2:24.2.1(190514210000S)(01543.012*m3)  // Gas usages timestamp and gas usage
!90E4                       // CRC
```

### Parsing messages explained

The [p1-reader](https://github.com/svrooij/smartmeter2mqtt/blob/master/lib/p1-reader.js) is responsible for connecting to one of the sources, it is an eventemitter that outputs the following events `line`, `dsmr`, `raw`, `usageChange`. It will send each line to the [p1-parser](https://github.com/svrooij/smartmeter2mqtt/blob/master/lib/p1-parser.js) for parsing and checking the message. To support extra data, you'll need to take a look at the [p1-map](https://github.com/svrooij/smartmeter2mqtt/blob/master/lib/p1-map.js) file, it contains the **id** used in the DSMR standard, the name in the result object and a **valueRetriever**. The **valueRetriever** is passed an array of values that where between brackets in the current line.

Supporting other data fields is just a matter of changing the **p1-map** file.

[badge_paypal_donate]: https://svrooij.nl/badges/paypal_donate.svg
[paypal-donations]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=T9XFJYUSPE4SG
[badge_sponsor]: https://img.shields.io/badge/Sponsor-on%20Github-red
[link_sponsor]: https://github.com/sponsors/svrooij
