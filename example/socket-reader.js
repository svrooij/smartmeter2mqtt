const Socket = require('net').Socket;
// const P1Crypt = require('../dist/p1-crypt').default;
const aad = '3000112233445566778899AABBCCDDEEFF';

const analyze = function (data, key) {
  //console.log(data);
  
  if (data.startsWith('db') && data.length > 54) { // make educated guess about the length as initial check
    //console.log(' - Packet starts with db');
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
    console.log(' - Delimiter index %d', delimiterIndex)
    const partBeforeDelimiter = rest.slice(0, delimiterIndex);
    const dataLength = parseInt(partBeforeDelimiter.slice(2), 16);
    const encryptedDataLength = (dataLength - 17) * 2;


    const counter = rest.slice(delimiterIndex + 2, delimiterIndex + 10);
    console.log(' - Frame counter: %s', counter);

    const dataAfterCounter = rest.slice(delimiterIndex + 10);
    const computedLength = dataAfterCounter.length - 24;
    console.log(' - Encrypted data length: %d (%d)', encryptedDataLength, computedLength);
    
    const encryptedData = rest.slice(delimiterIndex + 10, delimiterIndex + 10 + encryptedDataLength);
    const encryptedData2 = dataAfterCounter.substr(0, dataAfterCounter.length - 24);
    console.log(' - Encrypted Data: %s', encryptedData);
    console.log(' - Encrypted Data2: %s', encryptedData2);
    const tag = dataAfterCounter.slice(-24);
    console.log(' - GCM tag: %s', tag);

    if (key && encryptedData2 && counter && systemTitle) {
      decrypt(key, `${systemTitle}${counter}`, encryptedData2, tag, true)
    } else {
      console.log('\r\n----------------------\r\n')
    }

  }
}

const decrypt = function(key, iv, data, tag, validate = false) {
  const crypto = require('crypto');
  const alg = 'aes-128-gcm';
  const decipher = crypto.createDecipheriv(
    'aes-128-gcm',
    Buffer.from(key, 'hex'),
    Buffer.from(iv, 'hex'),
    {
      authTagLength: 12
    }
  );
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  decipher.setAAD(Buffer.from(aad, 'hex'));
  let result = decipher.update(data, 'hex', 'utf8');
  if (validate) {
    result += decipher.final();
  }
  
  
  console.log('--------\r\n%s',result);
}

if (process.argv.length !== 4 && process.argv.length !== 5) {
  console.log('run: node socket-reader.js [socket-host] [socket-port] [key]')
} else {
  const host = process.argv[2];
  const port = parseInt(process.argv[3], 10);
  const key = process.argv[4];

  if (key.length !== 32) {
    console.warn('The key should be 32 chars')
    process.exit(100);
  }

  let timeout;
  let dataBuffer = '';

  const socket = new Socket();
  socket.setEncoding('hex');
  socket.connect(port, host);
  socket.on('data', (data) => {
    if(timeout) {
      clearTimeout(timeout);
    }
    dataBuffer += data.toString('hex');
    timeout = setTimeout(() => {
      const result = analyze(dataBuffer, key);
      dataBuffer = '';
    }, 100)
  });
}