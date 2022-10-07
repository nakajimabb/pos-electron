import * as crypto from 'crypto';
import ElectronStore from 'electron-store';

const store = new ElectronStore();
const algorithm = 'aes-256-cbc';
const inputEncoding = 'utf8';
const outputEncoding = 'hex';

const getSalt = () => {
  let salt = store.get('SALT');
  if (!salt) {
    salt = crypto.randomBytes(16).toString(outputEncoding);
    store.set('SALT', salt);
  }
  return salt.toString();
};

const getIv = () => {
  let iv = store.get('IV');
  if (!iv) {
    iv = crypto.randomBytes(16).toString(outputEncoding);
    store.set('IV', iv);
  }
  return iv.toString();
};

export const cipher = (plainText: string, key: string) => {
  const salt = Buffer.from(getSalt(), outputEncoding);
  const iv = Buffer.from(getIv(), outputEncoding);
  const cryptedKey = crypto.scryptSync(key, salt, 32);
  const cipher = crypto.createCipheriv(algorithm, cryptedKey, iv);
  let cipheredText = cipher.update(plainText, inputEncoding, outputEncoding);
  cipheredText += cipher.final(outputEncoding);
  return cipheredText;
};

export const decipher = (cipheredText: string, key: string) => {
  const salt = Buffer.from(getSalt(), outputEncoding);
  const iv = Buffer.from(getIv(), outputEncoding);
  const cryptedKey = crypto.scryptSync(key, salt, 32);
  const decipher = crypto.createDecipheriv(algorithm, cryptedKey, iv);
  let plainText = decipher.update(cipheredText, outputEncoding, inputEncoding);
  plainText += decipher.final(inputEncoding);
  return plainText;
};
