/**
 * Vault encryption.
 *
 * Replaces an implementation that used the master password *itself* as the
 * AES key:
 *
 *   importKey('raw', enc.encode(password.padEnd(32, '0').slice(0, 32)), 'AES-GCM', ...)
 *
 * That is AES-256 by key length only. With no key-derivation function, an
 * attacker holding the ciphertext can test a candidate password with a single
 * AES-GCM decrypt, so guessing runs at millions of attempts per second. The
 * `padEnd(32, '0')` made it worse: a short password contributed only its own
 * entropy and the remainder of the key was a known constant.
 *
 * Now: PBKDF2-HMAC-SHA256, 210,000 iterations (OWASP guidance for this PRF),
 * with a fresh 16-byte salt per encryption, feeding a 256-bit AES-GCM key and a
 * fresh 12-byte IV. The work factor is what makes the master password
 * expensive to guess; the cipher was never the weak part.
 *
 * Wire format (base64):
 *   'QV2' | version(1) | salt(16) | iv(12) | ciphertext+tag
 *
 * The magic prefix distinguishes this from the legacy `iv(12) | ciphertext`
 * layout, so anything written by the old scheme still decrypts on read - which
 * matters if vault rows are ever imported from the previous project.
 */

const MAGIC = [0x51, 0x56, 0x32]; // 'QV2'
const VERSION = 1;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const PBKDF2_ITERATIONS = 210_000;

function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
  usage: 'encrypt' | 'decrypt',
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    [usage],
  );
}

export async function encryptText(text: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt, 'encrypt');

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      key,
      new TextEncoder().encode(text),
    ),
  );

  const out = new Uint8Array(MAGIC.length + 1 + salt.length + iv.length + ciphertext.length);
  out.set(MAGIC, 0);
  out[MAGIC.length] = VERSION;
  out.set(salt, MAGIC.length + 1);
  out.set(iv, MAGIC.length + 1 + salt.length);
  out.set(ciphertext, MAGIC.length + 1 + salt.length + iv.length);

  return toBase64(out);
}

/** Reads anything written by the pre-PBKDF2 scheme so old rows stay readable. */
async function decryptLegacy(data: Uint8Array, password: string): Promise<string> {
  const iv = data.slice(0, IV_BYTES);
  const ciphertext = data.slice(IV_BYTES);
  const rawKey = new TextEncoder().encode(password.padEnd(32, '0').slice(0, 32));
  const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['decrypt']);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

export async function decryptText(ciphertextB64: string, password: string): Promise<string> {
  const data = fromBase64(ciphertextB64);

  const isCurrentFormat =
    data.length > MAGIC.length + 1 + SALT_BYTES + IV_BYTES &&
    MAGIC.every((b, i) => data[i] === b);

  if (!isCurrentFormat) return decryptLegacy(data, password);

  const offset = MAGIC.length + 1;
  const salt = data.slice(offset, offset + SALT_BYTES);
  const iv = data.slice(offset + SALT_BYTES, offset + SALT_BYTES + IV_BYTES);
  const ciphertext = data.slice(offset + SALT_BYTES + IV_BYTES);

  const key = await deriveKey(password, salt, 'decrypt');
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(plaintext);
}

/** True if a stored value still uses the weak pre-PBKDF2 layout. */
export function isLegacyCiphertext(ciphertextB64: string): boolean {
  try {
    const data = fromBase64(ciphertextB64);
    return !MAGIC.every((b, i) => data[i] === b);
  } catch {
    return false;
  }
}
