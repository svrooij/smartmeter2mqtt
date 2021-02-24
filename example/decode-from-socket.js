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

const aad = '3000112233445566778899AABBCCDDEEFF';
const testMessage = '' + 'db08' + 'abcdefabcdef1234' + '20' + '30' + '00000005' + '09876543210987654321fedcbadcba' + '0123456789abcdef01234567'

const analyze = function (data, key) {
  console.log(data);
  if (data.startsWith('db') && data.length > 54) { // make educated guess about the length as initial check
    console.log(' - Packet starts with db');
    const systemTitleLength = parseInt(data.substr(2, 2), 16);
    if (systemTitleLength !== 8) {
      console.log(' - Expected system title length to be 8 and not %d', systemTitleLength);
      return;
    }
    const systemTitle = data.substr(4, systemTitleLength * 2);
    console.log(' - System Title: %s', systemTitle);

    const rest = data.substr(4 + (systemTitleLength * 2));
    console.log(' - Data after system title %s...', rest.slice(0, 16));
    const delimiterIndex = rest.indexOf('30');
    const dataLength = parseInt(rest.slice(0, delimiterIndex), 16);
    const encryptedDataLength = (dataLength - 17) * 2;
    console.log(' - Encrypted data length: %d', encryptedDataLength);

    const counter = rest.slice(delimiterIndex + 2, delimiterIndex + 10);
    console.log(' - Frame counter: %s', counter);
    
    const encryptedData = rest.slice(delimiterIndex + 10, delimiterIndex + 10 + encryptedDataLength);
    console.log(' - Encrypted Data: %s', encryptedData);
    const tag = data.slice(-24);
    console.log(' - GCM tag: %s', tag);

    if (key && encryptedData && counter && systemTitle) {
      decrypt(key, `${systemTitle}${counter}`, encryptedData, tag)
    }

  }
}

const decrypt = function(key, iv, data, tag) {
  const crypto = require('crypto');
  const alg = 'aes-128-gcm';
  const decipher = crypto.createDecipheriv('aes-128-gcm', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  decipher.setAuthTag(tag, 'hex');
  decipher.setAAD(Buffer.from(aad, 'hex'));
  let result = decipher.update(data, 'hex');
  result += decipher.final();
  console.log('----👌----\r\n%s',result);
}

if (process.argv.length !== 4 && process.argv.length !== 5) {
  console.log('run: node decode-from-socket.js [socket-host] [socket-port] [key]')
  console.log('Parsing test message');
  analyze(testMessage);
} else {
  const host = process.argv[2];
  const port = parseInt(process.argv[3], 10);
  const key = process.argv[4];

  let timeout;
  let result = '';

  const socket = new Socket();
  socket.setEncoding('hex');
  socket.connect(port, host);
  socket.on('data', (data) => {
    if(timeout) {
      clearTimeout(timeout);
    }
    result += data.toString('hex');
    timeout = setTimeout(() => {
      analyze(result, key);
      result = '';
    }, 100)
  });
}
