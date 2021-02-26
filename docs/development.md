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

```shell
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

This library has several VSCode tasks defined, be sure to change your port/socket in the `.vscode/launch.json` file. If you open an example file and press **F5** the example is run and you can set breakpoints in the sample code and in the TypeScript code.

## Repository content

- **docs/** These documentations
- **src/output/** Several different outputs
- **src/** Main app files
- **tests/..** - All the tests, using the Jest framework.
