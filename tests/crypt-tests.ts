import * as chai from 'chai';
const expect = chai.expect;
import { P1Crypt } from '../src/p1-crypt';
import fs from 'fs';

const fakeKey = 'ef3f65c8b6e4000dce8ba35f6af212e1';
describe('P1Crypt', function () {

  it('should encrypt and decrypt message', () => {
    
    const crypt = new P1Crypt(fakeKey);
    const text = fs.readFileSync('./p1-message.txt').toString();
    const systemTitle = 'abcdefabcdef1234';

    const encryptedData = crypt.encryptDsmr(text, systemTitle, 20);

    const result = crypt.decryptToDsmr(encryptedData);

    expect(result?.frameCounter).to.be.eq(20);
    expect(result?.systemTitle).to.be.eq(systemTitle);
    expect(result?.message).to.be.eq(text);
  })

  it('throws error on faulty key length', () => {
    expect(() => new P1Crypt('xxxx')).to.throw('The key should be 32 hex characters');
  })

  it('throws error on faulty system title length', () => {
    const crypt = new P1Crypt(fakeKey);
    
    expect(() => crypt.decryptToDsmr('db050000000000000000000000000000000000000000000000000000000000000000000')).to.throw('SystemTitle length is not 8');
  })

  it('returns undefined when message not starts with db', () => {
    const crypt = new P1Crypt(fakeKey);
    const result = crypt.decryptToDsmr('xx');
    expect(result).to.be.undefined;
  })
})

