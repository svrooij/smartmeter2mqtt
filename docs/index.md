---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: default
title: Home
nav_order: 1
permalink: /
---

# Smartmeter2mqtt

[![Smartmeter2mqtt documentation][badge_smartmeter-docs]][link_smartmeter-docs]
[![Support me on Github][badge_sponsor]][link_sponsor]

[![npm][badge_npm]][link_npm]
[![docker pulls][badge_docker]][link_docker]
[![Run tests and publish][badge_build]][link_build]
[![github issues][badge_issues]][link_issues]
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](//github.com/semantic-release/semantic-release)

An application that parses smartmeter data over the network or a P1 cable.

## Key features

- [x] Connect to smartmeter over p1 cable or p1-to-socket device.
- [x] Parse DSMR data
- [x] Output socket to daisy-chain other applications
- [x] Decrypt Luxemburg smartmeter data

## Get Started

You can run this application in several way, docker (compose) is the recommended way.

### Choose smartmeter connection

You need to get either a [p1-to-tcp](connect.html#2-p1-to-usb) or a [p1-to-usb](connect.html#2-p1-to-usb) device.

## Docker

My setup is a Raspberry Pi 3 model b rev 1.2 (See `cat /proc/cpuinfo`) with a [P1 cable](connect.html#2-p1-to-usb) running [Hypriot](https://blog.hypriot.com/downloads/) as an OS (because of the pre-configured docker/docker-compose).

The [docker image](https://hub.docker.com/r/svrooij/smartmeter) is currently automatically build from every new release. We support the following platforms (can be extended if we have someone willing to test it out):

- AMD64 `linux/amd64`
- ARM v6 (raspberry pi ?) `linux/arm/v6`
- ARM v7 (raspberry pi 3/3b) `linux/arm/v7`
- ARM64 (raspberry pi 4 running in 64 bit) `linux/arm64`

### Docker compose with socket

```yml
version: "3.7"

services:
  smartmeter:
    image: svrooij/smartmeter:latest
    restart: unless-stopped
    ports: # Depending on your situation you'll need to expose some ports
      - 3000:3000
      - 3010:3010
      - 3020:3020
    environment:
      - TZ=Europe/Amsterdam
      - SMARTMETER_SOCKET=192.168.1.15:23
      - SMARTMETER_web-server=3000
      - SMARTMETER_tcp-server=3010
      - SMARTMETER_raw-tcp-server=3020
      # - SMARTMETER_enc-key=056F9B0CFEDF150E889BEAD52FA7A174 # if you need to decrypt the messages
      # - SMARTMETER_sunspec-modbus=192.168.x.x # if you want to also read your solar inverter.
```

### Docker compose with usb

If you're reading from an USB to P1 cable, it's important that you connect the device to the container. The mapped location might change on reboot or if you connect other devices. That is why I recommend to connect the device by serial. You will need the real device location, type `ls /dev/serial/by-id` and note the device string that looks like `usb-FTDI_FT232R_USB_UART_A13LN4ZS-if00-port0` for my cable.

Be sure to replace this device id in the docker compose file.

```yml
version: "3.7"

services:
  smartmeter:
    image: svrooij/smartmeter:latest
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
      # - SMARTMETER_enc-key=056F9B0CFEDF150E889BEAD52FA7A174 # if you need to decrypt the messages
      # - SMARTMETER_sunspec-modbus=192.168.x.x # if you want to also read your solar inverter.
```

## Bare metal

You don't need docker to run this app, you can also install the app locally and run it from the command line.

1. Install npm i -g smartmeter2mqtt --production
2. Figure out [how you want connect](/connect.html) to your smartmeter.
3. Start application to see if it works
4. Configure to run in background see stackoverflow answer.

[badge_build]: https://github.com/svrooij/smartmeter2mqtt/workflows/Run%20tests%20and%20publish/badge.svg
[badge_docker]: https://img.shields.io/docker/pulls/svrooij/smartmeter?style=flat-square
[badge_issues]: https://img.shields.io/github/issues/svrooij/smartmeter2mqtt?style=flat-square
[badge_npm]: https://img.shields.io/npm/v/smartmeter2mqtt?style=flat-square
[badge_smartmeter-docs]: https://img.shields.io/badge/smartmeter-mqtt-blue?style=flat-square
[badge_sponsor]: https://img.shields.io/badge/Sponsor-on%20Github-red?style=flat-square

[link_build]: https://github.com/svrooij/smartmeter2mqtt/actions
[link_docker]: https://hub.docker.com/r/svrooij/smartmeter
[link_issues]: https://github.com/svrooij/smartmeter2mqtt/issues
[link_npm]: https://www.npmjs.com/package/smartmeter2mqtt
[link_smartmeter-docs]: https://svrooij.io/smartmeter2mqtt
[link_sponsor]: https://github.com/sponsors/svrooij
