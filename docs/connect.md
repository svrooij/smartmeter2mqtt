---
layout: default
title: Connection to smartmeter
nav_order: 2
has_toc: false
---

# Connection to Smartmeter

You'll need a way to connect to your smartmeter. There are roughly 2 options.

## 1. P1-to-tcp-socket

There are several devices that conenct to the P1 port of the smartmeter and expose an TCP socket to connect to.

Using such a device has the added advantage that you can (probably) use it in multiple apps, instead of just one app.

{% include network.html %}

All these device will give you a port address in the format `{ip}:{port}`, eg. `192.168.1.15:23` and this needs to be set in the `socket` config for this app.

## 2. P1-to-usb

There are several devices that conenct to the P1 port of the smartmeter and have an usb connection on the other side. These cables just expose an usb socket to the OS.

{% include usb.html %}

Linux/mac note, most operating systems expose these devices as `/dev/ttyUSBx` but this location might change on reboot or if you connect an other device. It's recommended to use the **real** device location. Find the real device location: `ls /dev/serial/by-id` and note the device string that looks like `usb-FTDI_FT232R_USB_UART_A13LN4ZS-if00-port0` (for my cable).
