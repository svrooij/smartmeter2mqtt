import * as crypto from 'crypto';

interface DecryptionResult {
  frameCounter: number;
  systemTitle: string;
  message?: string;
}

/**
 * P1Crypt allows for decription (and encryption) of DSMR messages.
 */
export default class P1Crypt {
  // The tagsize is from the specs (default would be 16)
  private readonly gcmTagSizeBytes = 12;

  public constructor(private readonly key: string, private readonly aad: string = '3000112233445566778899AABBCCDFFDEE') {
    if (key.length !== 32) {
      throw new Error('The key should be 32 hex characters');
    }
  }

  /**
   * Decrypt an hexadecimal encoded data package from a smartmeter to the original DSMR package.
   * @param data Hexadecimal encoded, encrypted smartmeter message.
   */
  public decryptToDsmr(data: string): DecryptionResult | undefined {
    if (data.startsWith('db') && data.length > 54) {
      const systemTitleLength = parseInt(data.substr(2, 2), 16);
      if (systemTitleLength !== 8) {
        throw new Error('SystemTitle length is not 8');
      }

      const systemTitle = data.substr(4, systemTitleLength * 2);
      const rest = data.substr(4 + (systemTitleLength * 2));
      const delimiterIndex = rest.slice(6, 8) === '30' ? 6 : rest.indexOf('30');
      const partBeforeDelimiter = rest.slice(0, delimiterIndex);
      // not sure why we need to skip the first 2 characters.
      const dataLength = parseInt(partBeforeDelimiter.slice(2), 16);
      const encryptedDataLength = (dataLength - 17) * 2;

      const dataIndex = delimiterIndex + 10;
      const counter = rest.slice(delimiterIndex + 2, dataIndex);
      const dataAfterCounter = rest.slice(delimiterIndex + 10);
      // const encryptedData = rest.slice(dataIndex, dataIndex + encryptedDataLength);
      const encryptedData = dataAfterCounter.substr(0, encryptedDataLength);

      const tag = dataAfterCounter.substr(encryptedDataLength);
      if (tag.length < 24) {
        console.warn('Tag length less then 24, ignoring message');
        // throw new Error('Tag length lower then 24');
      }
      try {
        return this.decrypt(systemTitle, counter, encryptedData, tag);
      } catch (err) {
        console.warn('Error decrypting message', err);
      }
    }
    return undefined;
  }

  /**
   * Decrypt the actual data.
   * @param systemTitle System title, part of the IV used in decryption
   * @param frameCounter Number of the message, should only increment, part of the IV used in decryption
   * @param encryptedData The encrypted message
   * @param tag the gcm tag, used in validating the encrypted message.
   */
  private decrypt(systemTitle: string, frameCounter: string, encryptedData: string, tag: string): DecryptionResult {
    const decipher = crypto.createDecipheriv(
      'aes-128-gcm',
      Buffer.from(this.key, 'hex'),
      Buffer.from(`${systemTitle}${frameCounter}`, 'hex'),
      {
        authTagLength: this.gcmTagSizeBytes,
      },
    );

    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    decipher.setAAD(Buffer.from(this.aad, 'hex'));

    let result = decipher.update(encryptedData, 'hex', 'utf8');
    result += decipher.final();
    return {
      systemTitle,
      frameCounter: parseInt(frameCounter, 16),
      message: result,
    };
  }

  /**
   * Encrypt a DSMR message according to the Luxemburg smartmeter specs
   * @param dsmrTelegram Original Dsmr telegram message
   * @param systemTitle System title 8 byte hex (probably meter ID or something like data)
   * @param frameCounter Used counter, this should always increment used in encryption.
   *
   * @remarks See page 9 in this pdf https://smarty.creos.net/wp-content/uploads/P1PortSpecification.pdf
   */
  public encryptDsmr(dsmrTelegram: string, systemTitle = 'abcdefabcdef1234', frameCounter = 1): string {
    const counterHex = frameCounter.toString(16).padStart(8, '0');
    const ivHex = `${systemTitle}${counterHex}`;
    const cipher = crypto.createCipheriv(
      'aes-128-gcm',
      Buffer.from(this.key, 'hex'),
      Buffer.from(ivHex, 'hex'),
      {
        authTagLength: 12,
      },
    );
    cipher.setAAD(Buffer.from(this.aad, 'hex'));
    let encData = cipher.update(dsmrTelegram, 'utf8', 'hex');
    encData += cipher.final('hex');
    const dataLength = (encData.length / 2) + 17;
    // Not sure why this number needs to be padded, but as seen in actual messages
    const lengthHex = dataLength.toString(16).padStart(6, '0');
    const tag = cipher.getAuthTag().toString('hex');
    const meterMessage = `db08${systemTitle}${lengthHex}30${counterHex}${encData}${tag}`;
    return meterMessage;
  }
}
