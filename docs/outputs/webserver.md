---
layout: default
title: Webpage (and api)
parent: Outputs
---

# Smartmeter2mqtt webpage

You can enable a webserver. This will enable you to see a simple webpage with the latest data from your smartmeter (PR with styling appreciated!). It will also enable an endpoint that responds with json with all the available data. Start this output with `--web-server [port]`, and the webpage will be available on `http://[ip-of-server]:[port]/` and the json endpoint will be available on `http://[ip-of-server]:[port]/api/reading`.

This webpage uses WebSockets for automatic server side data refresh. So the browser will show the latest data as it comes in. If your browser doesn't support websockets it should fallback on ajax loading.

![Screenshot of smartmeter2mqtt web page](/assets/images/screenshot_web.png)
