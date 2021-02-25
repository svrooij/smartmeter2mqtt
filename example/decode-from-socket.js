/* ---------------------------------
 * Test luxemburg smart meter decryption
 *
 * This file is to test some stuff.
 * 
 * Run with this command 'node decode-from-socket.js sockethost port'
 * eg 'node decode-from-socket.js 192.168.1.15 23'
 * 
 */

const Socket = require('net').Socket;
const P1Crypt = require('../dist/p1-crypt').default;

const aad = '3000112233445566778899AABBCCDDEEFF';

if (process.argv.length !== 4 && process.argv.length !== 5) {
  console.log('run: node decode-from-socket.js [socket-host] [socket-port] [key]')
} else {
  const host = process.argv[2];
  const port = parseInt(process.argv[3], 10);
  const key = process.argv[4];

  let timeout;
  let dataBuffer = '';

  const socket = new Socket();
  const decryptor = new P1Crypt(key, aad);
  socket.setEncoding('hex');
  socket.connect(port, host);
  socket.on('data', (data) => {
    if(timeout) {
      clearTimeout(timeout);
    }
    dataBuffer += data.toString('hex');
    timeout = setTimeout(() => {
      const result = decryptor.decryptToDsmr(dataBuffer);
      if (result) {
        console.log('Frame counter: %d', result.frameCounter);
        console.log('SystemTitle: %s', result.systemTitle);
        console.log(result.message);
      }
      dataBuffer = '';
    }, 100)
  });
}
