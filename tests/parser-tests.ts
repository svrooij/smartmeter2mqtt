import * as chai from 'chai';
const expect = chai.expect;
import P1Parser from '../src/p1-parser';
import P1Map from '../src/p1-map';
import fs from 'fs';
describe('P1Parser', function () {

  it('Should parse partial message', function () {
    const parser = new P1Parser()

    expect(parser.addLine('/KFM5KAIFA-METER')).to.be.eq(false, 'Add Header should not return true')
    expect(parser.addLine('0-0:1.0.0(190514213620S)')).to.be.eq(false, 'Add TS should not return true')
    expect(parser.addLine('0-0:96.1.1(453xxxxxxxxxx)')).to.be.eq(false, 'Add sn line should not return true')
    expect(parser.addLine('1-0:1.8.1(002000.123*kWh)')).to.be.eq(false, 'Add usage line should not return true')
    expect(parser.addLine('1-0:1.8.2(001000.456*kWh)')).to.be.eq(false, 'Add usage line should not return true')
    expect(parser.addLine('!90E4')).to.be.eq(true, 'Add end should return true')
    expect(parser.data.powerSn).to.be.eq('453xxxxxxxxxx', 'Serial not set')
  })

  it('Should check crc', function () {
    const parser = new P1Parser()
    const text = fs.readFileSync('./p1-message.txt')
    const lines = text.toString().split('\n')
    lines.forEach((line) => {
      parser.addLine(line.trim())
    })
    // console.log(parser.result()) // to see how the parser handles the sample message
    expect(parser.data.crc).to.be.eq(true, 'CRC should be true')
  })
})

describe('P1Map', function () {

  it('Should parse timestamp string', function () {
    const result = P1Map.parseLine('0-0:1.0.0(190514213620S)')
    expect(result?.id).to.be.eq('0-0:1.0.0', 'id is incorrect')
    expect(result?.value).to.be.eq('2019-05-14T21:36:20', 'value is incorrect')
    expect(result?.name).to.be.eq('powerTs', 'name is incorrect')
  })

  it('should have unique ids', function () {
    const ids = P1Map.mapping.map((val) => val.id)

    const uniqueIds = ids.filter(distinctFilter)
    const duplicates = ids.length - uniqueIds.length
    expect(duplicates).to.be.eq(0, `You have ${duplicates} duplicate ids`)
  })

  it('should have unique names', function () {
    const ids = P1Map.mapping.map((val) => val.name)

    const uniqueIds = ids.filter(distinctFilter)
    const duplicates = ids.length - uniqueIds.length
    expect(duplicates).to.be.eq(0, `You have ${duplicates} duplicate names`)
  })
})

const distinctFilter = function (item: string, index: number, array: Array<string>) {
  return array.indexOf(item) >= index
}
