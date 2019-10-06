
const pkg = require('../package.json')
const config = require('yargs')
  .env('SMARTMETER')
  .usage(pkg.name + ' ' + pkg.version + '\n' + pkg.description +
    '\n\nRead from P1 to USB serial:\n$0 --port /dev/ttyUSB0 [options]' +
    '\n\nRead from tcp socket:\n$0 --socket host:port [options]')
  .epilog('All options can also be specified as Environment valiables' +
    '\r\nPrefix them with \'SMARTMETER_\' and make them all uppercase')
  .describe('port', 'The serial port to read, P1 to serial usb, eg. \'/dev/ttyUSB0\'')
  .describe('socket', 'The tcp socket to read, if reading from serial to network device, as host:port, like \'192.168.0.3:3000\'')
  .describe('web-server', 'Expose webserver on this port')
  .describe('post-url', 'Post the results to this url')
  .describe('post-interval', 'Seconds between posts')
  .describe('tcp-server', 'Expose JSON TCP socket on this port')
  .describe('raw-tcp-server', 'Expose RAW TCP socket on this port')
  .conflicts('port', 'socket')
  .describe('debug', 'Enable debug output')
  .boolean('debug')
  .number('web-server')
  .number('tcp-server')
  .number('raw-tcp-server')
  .number('post-interval')
  .alias({
    'h': 'help'
  })
  .default({
    'post-interval': 300
  })
  .wrap(80)
  .version()
  .help('help')
  .argv
module.exports = config
