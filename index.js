const P1Reader = require('./lib/p1-reader')

const reader = new P1Reader('/dev/ttyUSB0', 115200)

reader.on('line', console.log)
reader.outputLines()

reader.on('dsmr', result => {
  console.log('Parsed message %s', JSON.stringify(result, null, 2))
})
reader.startParsing()

process.on('SIGINT', () => {
  reader.close(() => {
    process.exit()
  })
})
