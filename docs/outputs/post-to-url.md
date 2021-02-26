---
layout: default
title: Post to url
parent: Outputs
---

# Smartmeter2mqtt post to url output

This output will posts the new data to an URL, at an interval (to prevent overloading of remote). You can provide the url to post to with `--post-url [url]`.

You can also configure the interval with `--post-interval 300` (to set it to 300 seconds).

By default the data is posted as form variables, if you want you can have it post as json by specifing `--post-json`.
