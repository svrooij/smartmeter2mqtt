---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: default
title: Development
nav_order: 10
permalink: /development
---

# Development
{: .no_toc }

This library is hosted on [Github](https://github.com/svrooij/smartmeter2mqtt), contributions are more then welcome.

1. TOC
{:toc}

---

## Fork library

You should start by creating a [fork](https://github.com/svrooij/smartmeter2mqtt/fork). Or if you already had a fork sync the fork:

```bash
# Add the remote, call it "upstream": (only once)
git remote add upstream https://github.com/svrooij/smartmeter2mqtt.git

# Fetch all the branches of that remote into remote-tracking branches,
# such as upstream/master:
git fetch upstream

# Make sure that you're on your beta branch:
git checkout beta

# Rewrite your beta branch so that any commits of yours that
# aren't already in upstream/beta are replayed on top of that
# other branch:
git rebase upstream/beta
```

## Install Pull

We like to use the Github [pull](https://github.com/apps/pull) application, to keep our beta branch and the forks up-to-date. You have to install this application yourself, but it will work automatically.

## Compile the library

Before you can use this library is has to be compiled.

`npm run install && npm run compile`

## Run the tests

After changing somehting you should run the tests (as they are automatically run before your PR is accepted).

`npm run test`

## Debugging

This library has several VSCode tasks defined, be sure to create a `.env` file in the root of the project. It is loaded by `.vscode/launch.json` during debugging.
If you open an example file and press **F5** the example is run and you can set breakpoints in the sample code and in the TypeScript code.

### .env file for debugging

The `.env` file should look like this (with your configuration off-course):

```shell
# Pick either the port or the socket (and set the encryption key if needed)
# SMARTMETER_PORT=/dev/ttyUSB0
# SMARTMETER_SOCKET=192.168.1.10:3020
# SMARTMETER_enc-key=AAAA57A9FC71698E193D7CF6103CAAAA

# Enable one or more outputs
# SMARTMETER_DEBUG=true
SMARTMETER_web-server=3000
SMARTMETER_tcp-server=3010
SMARTMETER_raw-tcp-server=3020
# SMARTMETER_mqtt-url=mqtt://localhost:1883
# SMARTMETER_influx-url=https://westeurope-1.azure.cloud2.influxdata.com
# SMARTMETER_influx-token=
# SMARTMETER_influx-org=
# SMARTMETER_influx-bucket=energy

# Enable reading solar from modbus tcp
# SMARTMETER_sunspec-modbus=192.168.1.30
```

## Live-reload documentation

This documentation is build from markdown files. It uses [Jekyll](https://jekyllrb.com/) to generate html files from markdown. For those who don't have ruby on their computer (like me), I've included a docker-compose that is setup to enable live-reloading the documentation.

```bash
# Go to docs root folder
cd docs

# Start docker container (first time takes longer because of package downloading).
docker-compose up
```

Your documentation should be up at [localhost:4000](http://localhost:4000) and your browser will refresh on save.

## Repository content

- **docs/** These documentations
- **src/output/** Several different outputs
- **src/** Main app files
- **tests/..** - All the tests, using the Jest framework.
