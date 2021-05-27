
const Smartmeter = require('../dist/index').Smartmeter;
const ConfigLoader = require('../dist/index').ConfigLoader;

const config = ConfigLoader.Load();

// Change something to the config
//config.outputs.debug = true;

const smartmeter = new Smartmeter(config);

// Add your custom output
// const newOutput = new xxx() // As long as it implements Output
// smartmeter.addOutput(newOutput);

smartmeter.start();

// Listen for exit signal and cleanly shutdown
process.on('SIGINT', async () => {
  console.log('Exiting....');
  await smartmeter.stop();
  process.exit(0);
});
