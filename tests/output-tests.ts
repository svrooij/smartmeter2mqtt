import * as chai from 'chai';
const expect = chai.expect;
import P1ReaderEvents from '../src/p1-reader-events'
import DebugOutput from '../src/output/debug-output'
import TcpOutput from '../src/output/tcp-output'
import WebServer from '../src/output/web-server'
import HttpOutput from '../src/output/http-output'
import MqttOutput from '../src/output/mqtt-output'
import P1Reader from '../src/p1-reader';

describe('DebugOutput', () => {
  it('Should subscribe to several events', () => {
    const fakeReader = new P1Reader()
    const debugOutput = new DebugOutput()
    debugOutput.start(fakeReader)
    expect(fakeReader.listenerCount(P1ReaderEvents.ParsedResult)).to.be.eq(1, 'Debug output not subscribed to ParsedResult event')
    expect(fakeReader.listenerCount(P1ReaderEvents.ErrorMessage)).to.be.eq(1, 'Debug output not subscribed to ErrorMessage event')
    debugOutput.close()
  })
})

describe('TcpOutput', () => {
  it('Should subscribe to Parsed result event', () => {
    const fakeReader = new P1Reader()
    const tcpServer = new TcpOutput(3000, false, false)
    tcpServer.start(fakeReader)
    expect(fakeReader.listenerCount(P1ReaderEvents.ParsedResult)).to.be.eq(1, 'Json TCP output not subscribed to ParsedResult event')
    tcpServer.close()
  })

  it('Should subscribe to Line event for rawSocket: true', () => {
    const fakeReader = new P1Reader()
    const tcpServer = new TcpOutput(3000, true, false)
    tcpServer.start(fakeReader)
    expect(fakeReader.listenerCount(P1ReaderEvents.Line)).to.be.eq(1, 'Raw TCP output not subscribed to Line event')
    tcpServer.close()
  })
})

describe('WebServer', () => {
  it('Should subscribe to Parsed result event', () => {
    const fakeReader = new P1Reader()
    const webServer = new WebServer(3002, false)
    webServer.start(fakeReader)
    expect(fakeReader.listenerCount(P1ReaderEvents.ParsedResult)).to.be.eq(1, 'Webserver not subscribed to ParsedResult event')
    webServer.close()
  })
})

describe('HttpOutput', () => {
  it('Should subscribe to Parsed result event', () => {
    const fakeReader = new P1Reader()
    const httpOutput = new HttpOutput({ url: '', json: true, interval: 30 })
    httpOutput.start(fakeReader)
    expect(fakeReader.listenerCount(P1ReaderEvents.ParsedResult)).to.be.eq(1, 'HttpOutput not subscribed to ParsedResult event')
    httpOutput.close()
  })
})

describe('MqttOutput', () => {
  it('Should subscribe to Parsed result event', () => {
    const fakeReader = new P1Reader()
    const mqttOutput = new MqttOutput({ discovery: false, discoveryPrefix: '', distinct: false, distinctFields: [''], prefix: '', url: '' })
    mqttOutput.start(fakeReader)
    expect(fakeReader.listenerCount(P1ReaderEvents.ParsedResult)).to.be.eq(1, 'MqttOutput not subscribed to ParsedResult event')

    mqttOutput.close()
  })
})
