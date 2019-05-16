/* eslint-disable no-undef */
const assert = require('assert')
const P1Parser = require('../lib/p1-parser')
describe('P1Parser', function () {
  it('Should parse timestamp string', function () {
    const result = P1Parser.parseLine('0-0:1.0.0(190514213620S)')
    assert.strictEqual(result.id, '0-0:1.0.0', 'id is incorrect')
    assert.strictEqual(result.value, '190514213620S', 'value is incorrect')
    assert.strictEqual(result.name, 'powerTs', 'name is incorrect')
  })

  it('Should parse partial message', function () {
    let parser = new P1Parser()
    assert.strictEqual(parser.addLine('/KFM5KAIFA-METER'), false, 'Add Header should not return true')
    assert.strictEqual(parser.addLine('0-0:1.0.0(190514213620S)'), false, 'Add TS should not return true')
    assert.strictEqual(parser.addLine('0-0:96.1.1(453xxxxxxxxxx)'), false, 'Add sn line should not return true')
    assert.strictEqual(parser.addLine('1-0:1.8.1(002000.123*kWh)'), false, 'Add usage line should not return true')
    assert.strictEqual(parser.addLine('1-0:1.8.2(001000.456*kWh)'), false, 'Add usage line should not return true')
    assert.strictEqual(parser.addLine('!90E4'), true, 'Add end should return true')
    console.log(parser.result)
    assert(parser.result.powerSn, 'Serial not set')
  })
})
