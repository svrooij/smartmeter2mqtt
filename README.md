# Smartmeter2mqtt

This application can listen to your (Dutch) Smartmeter with a P1 connector, and send the data to several sources. I plan to support the following methods:

- TCP Socket
- JSON Endpoint
- Website with websocket for server side refresh
- MQTT

Supporting other services like some website where you can monitor historic data is also possible. The P1 Reader just emits events.

## Getting started

1. Install the application `npm install smartmeter2mqtt -g`
2. Connect smartmeter
3. Start the application (for testing)
4. Run in background using [PM2](https://pm2.io/doc/en/runtime/overview/)

## Supported input connections

This application supports two inputs, you'll need either one.

For a **direct connection** you'll need a Smartmeter cable like [this one at sossolution](https://www.sossolutions.nl/slimme-meter-kabel), and connect it to a free usb port on the device reading the meter.

You can also connect to a **TCP socket**, this way you don't need the device running this program to be on a device near your meter. You can also check out this [ESP8266 P1 reader](http://www.esp8266thingies.nl/wp/), it creates a TCP socket for your meter.

## Output -> JSON tcp socket

This output creates a tcp socket where you will receive a newline delimeter json stream, to be used in your other applications.
Start it with the `--tcp-server [portnumer]` parameter. You can then see immediate result when you connect too it with for instance telnet `telnet [ip-of-server] [specified-port]`. Maximum 5 connections.

## Output -> Raw tcp socket

This output creates a tcp socket where you'll receive the raw data as it comes in. This is usefull if you want to debug the data coming in and don't want to restart your smartmeter2mqtt application all the time. This can in turn be used as an TCP socket input. Start it with `--raw-tcp-server [port]`. Maximum 5 connections.

Conect to it with `telnet [ip-of-server] [specified-port]` and see the data coming in on your windows machine.

This socket can also be used in domoticz as **P1-Wifi Gateway**.

## Usage

```bash
smartmeter2mqtt 0.0.1
Publish data from your Smartmeter with a P1 interface to your MQTT server.

Read from P1 to USB serial:
smartmeter2mqtt --port /dev/ttyUSB0 [options]

Read from tcp socket:
smartmeter2mqtt --socket host:port [options]

Options:
  --port            The serial port to read, P1 to serial usb, eg. '/dev/ttyUSB0'
  --socket          The tcp socket to read, if reading from serial to network device, eg. '192.168.0.3:3000'
  --tcp-server      Expose JSON TCP socket on this port                 [number]
  --raw-tcp-server  Expose RAW TCP socket on this port                  [number]
  --debug           Enable debug output                                [boolean]
  --version         Show version number                                [boolean]
  -h, --help        Show help                                          [boolean]
```

## DSMR - P1 Sample data

The Keifa meter outputs the following data as you connect to the serial connection.

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