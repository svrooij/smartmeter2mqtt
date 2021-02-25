// const crypto = require('crypto');
const P1Crypt = require('../dist/p1-crypt').default;
const aad = '3000112233445566778899AABBCCDFFDEE';
const fakeSystemTitle = 'abcdefabcdef1234';
const fakeKey = '056f9b0cfedf150e889bead52fa7a174';
const frameCounter = 10;
const originalMessage = `/KFM5KAIFA-METER

1-3:0.2.8(42)
0-0:1.0.0(190514213620S)
0-0:96.1.1(453xxxxxxxxxx)
1-0:1.8.1(002000.123*kWh)
1-0:1.8.2(001000.456*kWh)
1-0:2.8.1(001000.456*kWh)
1-0:2.8.2(002000.789*kWh)
0-0:96.14.0(0001)
1-0:1.7.0(00.329*kW)
1-0:2.7.0(00.000*kW)
0-0:96.7.21(00000)
0-0:96.7.9(00000)
1-0:99.97.0(1)(0-0:96.7.19)(000101000001W)(2147483647*s)
1-0:32.32.0(00000)
1-0:32.36.0(00000)
0-0:96.13.1()
0-0:96.13.0()
1-0:31.7.0(002*A)
1-0:21.7.0(00.329*kW)
1-0:22.7.0(00.000*kW)
0-2:24.1.0(003)
0-2:96.1.0(473xxx)
0-2:24.2.1(190514210000S)(01543.012*m3)
!588F`;

// const counterHex = frameCounter.toString(16).padStart(8, '0');
// const ivHex = `${fakeSystemTitle}${counterHex}`;

// const cipher = crypto.createCipheriv(
//   'aes-128-gcm',
//   Buffer.from(fakeKey, 'hex'),
//   Buffer.from(ivHex, 'hex'),
//   {
//     authTagLength: 12
//   }
// );
// cipher.setAAD(Buffer.from(aad, 'hex'));
// let encData = cipher.update(originalMessage,'utf8', 'hex');
// encData += cipher.final('hex');
// console.log(encData);

// const dataLength = (encData.length / 2) + 17;
// const lengthHex = dataLength.toString(16).padStart(6,'0');

// const tag = cipher.getAuthTag().toString('hex');

// const meterMessage = `db08${fakeSystemTitle}${lengthHex}30${counterHex}${encData}${tag}`;

// console.log('');

const crypt = new P1Crypt(fakeKey, aad);

const message = crypt.encryptDsmr(originalMessage, fakeSystemTitle, 10);

console.log(message);