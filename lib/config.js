
const pkg = require('../package.json')
const config = require('yargs')
  .usage(pkg.name + ' ' + pkg.version + '\n' + pkg.description + '\n\nUsage: $0 [options]')
  .describe('tcp-server', 'The tcp port to serve the raw TCP socket')
  .describe('debug', 'Enable debug output')
  .boolean('debug')
  .number('tcp-server')
  .alias({
    'h': 'help'
  })
  .default({
    'tcp-server': -1
  })
  .wrap(80)
  .version()
  .help('help')
  .argv
module.exports = config
