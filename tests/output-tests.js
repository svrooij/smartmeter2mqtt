/* eslint-disable no-undef */
const assert = require('assert')
const P1ReaderEvents = require('../lib/p1-reader-events')
const DebugOutput = require('../lib/output/debug-output')
const TcpServer = require('../lib/output/tcp-server')
const WebServer = require('../lib/output/web-server')
const EventEmitter = require('events')

describe('DebugOutput', function () {
  it('Should subscribe to several events', function () {
    let fakeReader = new EventEmitter()
    let debugOutput = new DebugOutput()
    debugOutput.start(fakeReader)
    assert.strictEqual(fakeReader.listenerCount(P1ReaderEvents.ParsedResult), 1, 'Debug output not subscribed to ParsedResult event')
    assert.strictEqual(fakeReader.listenerCount(P1ReaderEvents.ParsedResult), 1, 'Debug output not subscribed to ParsedResult event')
    assert.strictEqual(fakeReader.listenerCount(P1ReaderEvents.ErrorMessage), 1, 'Debug output not subscribed to ErrorMessage event')
    debugOutput.close()
  })
})

describe('TcpServer', function () {
  it('Should subscribe to Parsed result event', function () {
    let fakeReader = new EventEmitter()
    let tcpServer = new TcpServer()
    tcpServer.start(fakeReader, { startServer: false })
    assert.strictEqual(fakeReader.listenerCount(P1ReaderEvents.ParsedResult), 1, 'TCP server not subscribed to ParsedResult event')
  })
  it('Should subscribe to Line event for rawSocket: true', function () {
    let fakeReader = new EventEmitter()
    let tcpServer = new TcpServer()
    tcpServer.start(fakeReader, { rawSocket: true, port: 3001, startServer: false })
    assert.strictEqual(fakeReader.listenerCount(P1ReaderEvents.Line), 1, 'Raw TCP server not subscribed to ParsedResult event')
  })
})

describe('WebServer', function () {
  it('Should subscribe to Parsed result event', function () {
    let fakeReader = new EventEmitter()
    let webServer = new WebServer()
    webServer.start(fakeReader, { startServer: false })
    assert.strictEqual(fakeReader.listenerCount(P1ReaderEvents.ParsedResult), 1, 'WebServer not subscribed to ParsedResult event')
  })
})
