/* eslint-disable no-undef */
const assert = require('assert')
const P1Parser = require('../lib/p1-parser')
const P1Map = require('../lib/p1-map')
const fs = require('fs')
describe('P1Parser', function () {
  it('Should parse timestamp string', function () {
    const result = P1Parser.parseLine('0-0:1.0.0(190514213620S)')
    assert.strictEqual(result.id, '0-0:1.0.0', 'id is incorrect')
    assert.strictEqual(result.value, '2019-05-14T21:36:20', 'value is incorrect')
    assert.strictEqual(result.name, 'powerTs', 'name is incorrect')
  })

  it('Should parse partial message', function () {
    const parser = new P1Parser()
    assert.strictEqual(parser.addLine('/KFM5KAIFA-METER'), false, 'Add Header should not return true')
    assert.strictEqual(parser.addLine('0-0:1.0.0(190514213620S)'), false, 'Add TS should not return true')
    assert.strictEqual(parser.addLine('0-0:96.1.1(453xxxxxxxxxx)'), false, 'Add sn line should not return true')
    assert.strictEqual(parser.addLine('1-0:1.8.1(002000.123*kWh)'), false, 'Add usage line should not return true')
    assert.strictEqual(parser.addLine('1-0:1.8.2(001000.456*kWh)'), false, 'Add usage line should not return true')
    assert.strictEqual(parser.addLine('!90E4'), true, 'Add end should return true')
    assert.strictEqual(parser.result().powerSn, '453xxxxxxxxxx', 'Serial not set')
  })

  it('Should check crc', function () {
    const parser = new P1Parser(true)
    const text = fs.readFileSync('./p1-message.txt')
    const lines = text.toString().split('\n')
    lines.forEach((line) => {
      parser.addLine(line.trim())
    })
    // console.log(parser.result()) // to see how the parser handles the sample message
    assert.strictEqual(parser.result().crc, true, 'CRC should be true')
  })
})

describe('P1Map', function () {
  it('should have unique ids', function () {
    const ids = P1Map.map((val) => val.id)

    const uniqueIds = ids.filter(distinctFilter)
    const duplicates = ids.length - uniqueIds.length
    assert.strictEqual(duplicates, 0, `You have ${duplicates} duplicate ids`)
  })

  it('should have unique names', function () {
    const ids = P1Map.map((val) => val.name)

    const uniqueIds = ids.filter(distinctFilter)
    const duplicates = ids.length - uniqueIds.length
    assert.strictEqual(duplicates, 0, `You have ${duplicates} duplicate names`)
  })
})

const distinctFilter = function (item, index, array) {
  return array.indexOf(item) >= index
}
