/**
 * RFC 6238 Time-Based One-Time Password (TOTP) & Base32 Utility.
 * Provides 2FA token generation compatible with Google Authenticator, Authy, etc.
 */

// Base32 Alphabet RFC 4648
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decodes a Base32 string into a Uint8Array.
 */
export function base32Decode(base32Str: string): Uint8Array {
  const cleaned = base32Str.toUpperCase().replace(/[\s=-]/g, '');
  const bits: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const val = BASE32_ALPHABET.indexOf(cleaned.charAt(i));
    if (val === -1) continue; // Skip invalid chars

    for (let bit = 4; bit >= 0; bit--) {
      bits.push((val >> bit) & 1);
    }
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    let byteVal = 0;
    for (let bit = 0; bit < 8; bit++) {
      byteVal = (byteVal << 1) | bits[i * 8 + bit];
    }
    bytes[i] = byteVal;
  }

  return bytes;
}

/**
 * Pure JavaScript HMAC-SHA1 calculation for TOTP generation.
 */
function hmacSha1(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockSize = 64;
  let keyBuffer = key;

  if (keyBuffer.length > blockSize) {
    keyBuffer = sha1(keyBuffer);
  }

  if (keyBuffer.length < blockSize) {
    const padded = new Uint8Array(blockSize);
    padded.set(keyBuffer);
    keyBuffer = padded;
  }

  const oKeyPad = new Uint8Array(blockSize);
  const iKeyPad = new Uint8Array(blockSize);

  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = keyBuffer[i] ^ 0x5c;
    iKeyPad[i] = keyBuffer[i] ^ 0x36;
  }

  const innerMsg = new Uint8Array(blockSize + message.length);
  innerMsg.set(iKeyPad, 0);
  innerMsg.set(message, blockSize);
  const innerHash = sha1(innerMsg);

  const outerMsg = new Uint8Array(blockSize + innerHash.length);
  outerMsg.set(oKeyPad, 0);
  outerMsg.set(innerHash, blockSize);

  return sha1(outerMsg);
}

/**
 * Pure JS SHA-1 implementation.
 */
function sha1(data: Uint8Array): Uint8Array {
  const l = data.length;
  const wordCount = Math.floor((l + 8) / 64) + 1;
  const words = new Int32Array(wordCount * 16);

  for (let i = 0; i < l; i++) {
    words[i >> 2] |= data[i] << (24 - (i % 4) * 8);
  }
  words[l >> 2] |= 0x80 << (24 - (l % 4) * 8);
  words[words.length - 1] = l * 8;

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;
  let e = -1009589776;

  const w = new Int32Array(80);

  for (let i = 0; i < words.length; i += 16) {
    const oldA = a, oldB = b, oldC = c, oldD = d, oldE = e;

    for (let j = 0; j < 80; j++) {
      if (j < 16) {
        w[j] = words[i + j];
      } else {
        const temp = w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16];
        w[j] = (temp << 1) | (temp >>> 31);
      }

      let f = 0, k = 0;
      if (j < 20) {
        f = (b & c) | (~b & d);
        k = 1518500249;
      } else if (j < 40) {
        f = b ^ c ^ d;
        k = 1859775393;
      } else if (j < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = -1894007588;
      } else {
        f = b ^ c ^ d;
        k = -899497514;
      }

      const temp = (((a << 5) | (a >>> 27)) + f + e + k + w[j]) | 0;
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = temp;
    }

    a = (a + oldA) | 0;
    b = (b + oldB) | 0;
    c = (c + oldC) | 0;
    d = (d + oldD) | 0;
    e = (e + oldE) | 0;
  }

  const result = new Uint8Array(20);
  const h = [a, b, c, d, e];
  for (let i = 0; i < 5; i++) {
    result[i * 4] = (h[i] >>> 24) & 0xff;
    result[i * 4 + 1] = (h[i] >>> 16) & 0xff;
    result[i * 4 + 2] = (h[i] >>> 8) & 0xff;
    result[i * 4 + 3] = h[i] & 0xff;
  }

  return result;
}

export interface TOTPResult {
  code: string; // 6-digit code string e.g. "492018"
  formattedCode: string; // e.g. "492 018"
  remainingSeconds: number; // 0 to 30
  period: number; // 30
}

/**
 * Generates a 6-digit TOTP code and remaining seconds for a given Base32 secret.
 */
export function generateTOTP(base32Secret: string, period = 30, digits = 6): TOTPResult | null {
  try {
    if (!base32Secret || !base32Secret.trim()) return null;

    // Parse URI if user pasted otpauth://totp/Service:user?secret=JBSWY3DPEHPK3PXP
    let secret = base32Secret.trim();
    if (secret.startsWith('otpauth://')) {
      const match = secret.match(/secret=([A-Za-z2-7]+)/);
      if (match && match[1]) {
        secret = match[1];
      }
    }

    const keyBytes = base32Decode(secret);
    if (keyBytes.length === 0) return null;

    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / period);
    const remainingSeconds = period - (epoch % period);

    // Convert counter to 8-byte big-endian buffer
    const msg = new Uint8Array(8);
    let tempCounter = counter;
    for (let i = 7; i >= 0; i--) {
      msg[i] = tempCounter & 0xff;
      tempCounter = Math.floor(tempCounter / 256);
    }

    const hmac = hmacSha1(keyBytes, msg);
    const offset = hmac[hmac.length - 1] & 0xf;

    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = binary % Math.pow(10, digits);
    const code = otp.toString().padStart(digits, '0');
    const formattedCode = `${code.slice(0, 3)} ${code.slice(3)}`;

    return {
      code,
      formattedCode,
      remainingSeconds,
      period,
    };
  } catch (error) {
    console.error('Erro ao gerar TOTP 2FA:', error);
    return null;
  }
}
