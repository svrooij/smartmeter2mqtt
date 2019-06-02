# Smartmeter2mqtt

[![npm](https://img.shields.io/npm/v/smartmeter2mqtt.svg?style=flat-square)](https://www.npmjs.com/package/smartmeter2mqtt)
[![travis](https://img.shields.io/travis/svrooij/smartmeter2mqtt.svg?style=flat-square)](https://travis-ci.org/svrooij/smartmeter2mqtt)
[![mqtt-smarthome](https://img.shields.io/badge/mqtt-smarthome-blue.svg?style=flat-square)](https://github.com/mqtt-smarthome/mqtt-smarthome)
[![PayPal][badge_paypal_donate]][paypal-donations]
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)

This application can listen to your (Dutch) Smartmeter with a P1 connector, and send the data to several outputs. I plan to support the following methods:

- [x] JSON TCP socket
- [x] Raw TCP socket
- [x] Website with websockets (and ajax fallback) for client side refresh
- [x] Http json endpoint to get the latest reading
- [ ] MQTT

Supporting other services like some website where you can monitor historic data is also possible. [Building your own output](#support-for-output-x) is explained a bit lower on this page.

## Getting started

1. Install the application `npm install smartmeter2mqtt -g --production`
2. Connect smartmeter
3. Start the application (for testing)
4. Run in background using [PM2](https://pm2.io/doc/en/runtime/overview/) or run in docker container
5. Send out a tweet that you are using smartmeter2mqtt on [twitter @svrooij](https://twitter.com/svrooij)

### Running in docker

This app isn't build as a docker container in the registry just yet. PR's are welcome!

## Usage

```bash
smartmeter2mqtt 0.0.0-dev
Publish data from your Smartmeter with a P1 interface to your MQTT server.

Read from P1 to USB serial:
smartmeter2mqtt --port /dev/ttyUSB0 [options]

Read from tcp socket:
smartmeter2mqtt --socket host:port [options]

Options:
  --port            The serial port to read, P1 to serial usb, eg. '/dev/ttyUSB0'
  --socket          The tcp socket to read, if reading from serial to network device, eg. '192.168.0.3:3000'
  --web-server      Expose webserver on this port                       [number]
  --tcp-server      Expose JSON TCP socket on this port                 [number]
  --raw-tcp-server  Expose RAW TCP socket on this port                  [number]
  --debug           Enable debug output                                [boolean]
  --version         Show version number                                [boolean]
  -h, --help        Show help                                          [boolean]
```

## Inputs

This application supports two inputs, you'll need either one.

For a **direct connection** you'll need a Smartmeter cable like [this one at sossolutions](https://www.sossolutions.nl/slimme-meter-kabel?referal=svrooij), and connect it to a free usb port on the device reading the meter.

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

### Output -> Raw tcp socket

This output creates a tcp socket where you'll receive the raw data as it comes in. This is usefull if you want to debug the data coming in and don't want to restart your smartmeter2mqtt application all the time. This can in turn be used as an TCP socket input. Start it with `--raw-tcp-server [port]`. Maximum 3 connections.

Conect to it with `telnet [ip-of-server] [specified-port]` and see the data coming in on your windows machine.

This socket can also be used in domoticz as **P1-Wifi Gateway**.

## Developer section

This section is for the curious ones.

### Support for output X

This package comes with several outputs, they all extend [Output](./lib/output/output.js). Every new output should implement the `start(p1Reader, options)` method. They all get the instance of the current [P1Reader](./lib/p1-reader.js). So your new output should subscribe to one of the events. All events are defined in [P1ReaderEvents](./lib/p1-reader-events.js) and you should use the statics from the class, (even though they are just strings).

- **P1ReaderEvents.ParsedResult** to get the parsed result (if crc check validates), probably the one you want.
- **P1ReaderEvents.UsageChange** to get the changes in current usage. Already computed you dont have to.
- **P1ReaderEvents.Line** to get every line when they come in.
- **P1ReaderEvents.Raw** to get every raw message. Is transmitted as a complete string when the endline is received.

If you start some kind of server, be sure to also implemend the `close()` method.

Every output is wired to the input in the [index.js](index.js) file in the `_startOutputs()` method. Just check how it works.

```JavaScript
const YourOutput = require('./lib/output/your-output')
let yourOutput = new YourOutput()
yourOutput.start(this._reader, { option1: true, options2: false })
this.outputs.push(yourOutput)
```

Your output will get an event every 10 seconds, if you only want daily results you will need to build some logic to skip events.

### Run tests before PR

This library enforces [Javascript Standard Style](https://standardjs.com/) on every build. In the [tests](./tests) folder are several tests defined. So we don't break any existing code. Both the javascript styles and the tests can be run with `npm run test` in the main folder.

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

The [p1-reader](./lib/p1-reader.js) is responsible for connecting to one of the sources, it is an eventemitter that outputs the following events `line`, `dsmr`, `raw`, `usageChange`. It will send each line to the [p1-parser](./lib/p1-parser.js) for parsing and checking the message. To support extra data, you'll need to take a look at the [p1-map](./lib/p1-map.js) file, it contains the **id** used in the DSMR standard, the name in the result object and a **valueRetriever**. The **valueRetriever** is passed an array of values that where between brackets in the current line.

Supporting other data fields is just a matter of changing the **p1-map** file.

[badge_paypal_donate]: https://svrooij.nl/badges/paypal_donate.svg
[badge_patreon]: https://svrooij.nl/badges/patreon.svg
[paypal-donations]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=T9XFJYUSPE4SG
[patreon]: https://www.patreon.com/svrooij
