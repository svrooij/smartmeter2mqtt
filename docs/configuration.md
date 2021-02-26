---
layout: default
title: Configuration
nav_order: 5
---

# Configure smartmeter2mqtt

You can configure this app in several ways.

## Options

You can configure a lot of stuff with this library. Either the port or the socket are mandatory.

| Name | Argument | Environment prefix with `SMARTMETER_` | Description |
|:---- |:-------- |:------------------------------------- |:----------- |
| Socket  | `--socket` | `SOCKET` | See connect over [tcp socket](connect.html#1-p1-to-tcp-socket) |
| Port | `--port` | `PORT` | See connect over [usb](connect.html#2-p1-to-usb) |
| MQTT (output) | `--mqtt-url` | `MQTT-URL` | **mqtt-url** publish parsed dsmr messages to your mqtt server. See [mqtt](/outputs/mqtt.html) for more info. |
| Web server (output) | `--web-server` | `WEB-SERVER` | **number** start a [webserver](/outputs/webserver.html) at this port. |
| JSON socket (output) | `--tcp-server` | `TCP-SERVER` | **number** start a [json socket](/outputs/socket.html#json-socket) at this port. |
| RAW socket (output) | `--raw-tcp-server` | `RAW-TCP-SERVER` | **number** start a [raw socket](/outputs/socket.html#raw-socket) at this port. Can be used for daisy-chaining. |
| Post to url (output) | `--post-url` | `POST-URL` | **url** post the parsed data to this url, see [post output](/outputs/post-to-url.html) for more information |

## configure with arguments

```shell
smartmeter2mqtt 0.0.0-development
Publish data from your Smartmeter with a P1 interface to your MQTT server.      

Read from P1 to USB serial:
index.js --port /dev/ttyUSB0 [options]

Read from tcp socket:
index.js --socket host:port [options]

Options:
      --port                   The serial port to read, P1 to serial usb, eg.   
                               '/dev/ttyUSB0'
      --socket                 The tcp socket to read, if reading from serial to
                               network device, as host:port, like
                               '192.168.0.3:3000'
      --web-server             Expose webserver on this port            [number]
      --post-url               Post the results to this url
      --post-interval          Seconds between posts     [number] [default: 300]
      --post-json              Post the data as json instead of form parameters
                                                                       [boolean]
      --post-fields            Fields to post                           [string]
      --mqtt-url               Send the data to this mqtt server
      --mqtt-topic             Use this topic prefix for all messages
                                                         [default: "smartmeter"]
      --mqtt-distinct          Publish data distinct to mqtt           [boolean]
      --mqtt-distinct-fields   A comma separated list of fields you want
                               published distinct.                      [string]
      --mqtt-discovery         Emit auto-discovery message             [boolean]
      --mqtt-discovery-prefix  Autodiscovery prefix   [default: "homeassistant"]
      --tcp-server             Expose JSON TCP socket on this port      [number]
      --raw-tcp-server         Expose RAW TCP socket on this port       [number]
      --debug                  Enable debug output                     [boolean]
      --sunspec-modbus         IP of solar inverter with modbus TCP enabled
      --sunspec-modbus-port    modbus TCP port           [number] [default: 502]
      --enc-aad                Additional authentication data, if your meter
                               encrypts data (eg. Luxemburg)
                        [string] [default: "3000112233445566778899AABBCCDDEEFF"]
      --enc-key                Decryption key. Request from energy company
                                                                        [string]
      --version                Show version number                     [boolean]
  -h, --help                   Show help                               [boolean]

All options can also be specified as Environment valiables
Prefix them with 'SMARTMETER_' and make them all uppercase
```
