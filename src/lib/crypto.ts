const LEGACY_PREFIX = "MKE1.";
const COMPACT_PREFIX = "MKE2.";
const FORMAT_VERSION = 1;
const ITERATIONS = 600_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 128;
const MAX_TEXT_BYTES = 5 * 1024 * 1024;
const MAX_ENVELOPE_CHARS = 8_000_000;
const LEGACY_AAD = new TextEncoder().encode("Mikhayl Encrypter|MKE1");

type LegacyEnvelope = {
  v: number;
  alg: "AES-256-GCM";
  kdf: "PBKDF2-SHA-256";
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
};

export class CryptoInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CryptoInputError";
  }
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new CryptoInputError("Format ciphertext tidak valid atau rusak.");
  }
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  } catch {
    throw new CryptoInputError("Format ciphertext tidak valid atau rusak.");
  }
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new CryptoInputError("Format ciphertext ringkas tidak valid.");
  }
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  return base64ToBytes(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
}

function requireWebCrypto(): void {
  if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) {
    throw new Error("Browser ini tidak mendukung Web Crypto API. Gunakan browser modern melalui koneksi HTTPS.");
  }
}

function validateText(text: string): Uint8Array {
  const encoded = new TextEncoder().encode(text);
  if (encoded.length === 0) throw new CryptoInputError("Masukkan teks terlebih dahulu.");
  if (encoded.length > MAX_TEXT_BYTES) throw new CryptoInputError("Ukuran teks maksimal 5 MB.");
  return encoded;
}

export function validatePassword(password: string): void {
  if (Array.from(password).length < 1) {
    throw new CryptoInputError("Kata sandi wajib diisi minimal 1 karakter.");
  }
  if (password.length > 1024) {
    throw new CryptoInputError("Kata sandi terlalu panjang (maksimal 1.024 karakter).");
  }
}

async function deriveKey(password: string, salt: Uint8Array, keyLength: 128 | 256): Promise<CryptoKey> {
  const passwordBytes = new TextEncoder().encode(password.normalize("NFKC"));
  const material = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(passwordBytes),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: toArrayBuffer(salt),
      iterations: ITERATIONS,
    },
    material,
    { name: "AES-GCM", length: keyLength },
    false,
    ["encrypt", "decrypt"],
  );
}

function aadFor(keyLength: 128 | 256): Uint8Array {
  return new TextEncoder().encode(`Mikhayl Encrypter|MKE2|AES-${keyLength}-GCM`);
}

/**
 * MKE2 is a compact binary envelope:
 * [version:1][algorithm:1][salt length:1][IV length:1][salt][IV][ciphertext + GCM tag]
 * The outer representation is unpadded Base64URL with an MKE2 prefix.
 */
export async function encryptText(
  plaintext: string,
  password: string,
  keyLength: 128 | 256 = 256,
): Promise<string> {
  requireWebCrypto();
  validatePassword(password);
  const plaintextBytes = validateText(plaintext);

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt, keyLength);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: toArrayBuffer(iv),
        additionalData: toArrayBuffer(aadFor(keyLength)),
        tagLength: TAG_LENGTH,
      },
      key,
      toArrayBuffer(plaintextBytes),
    ),
  );

  const binary = new Uint8Array(4 + salt.length + iv.length + encrypted.length);
  binary[0] = FORMAT_VERSION;
  binary[1] = keyLength === 256 ? 1 : 2;
  binary[2] = SALT_LENGTH;
  binary[3] = IV_LENGTH;
  binary.set(salt, 4);
  binary.set(iv, 4 + SALT_LENGTH);
  binary.set(encrypted, 4 + SALT_LENGTH + IV_LENGTH);

  return COMPACT_PREFIX + bytesToBase64Url(binary);
}

async function decryptLegacyMke1(normalized: string, password: string): Promise<string> {
  let envelope: LegacyEnvelope;
  const encoded = base64ToBytes(normalized.slice(LEGACY_PREFIX.length));

  try {
    envelope = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(encoded)) as LegacyEnvelope;
  } catch {
    throw new CryptoInputError("Ciphertext MKE1 tidak valid atau telah rusak.");
  }

  if (
    envelope?.v !== FORMAT_VERSION ||
    envelope.alg !== "AES-256-GCM" ||
    envelope.kdf !== "PBKDF2-SHA-256" ||
    envelope.iterations !== ITERATIONS ||
    typeof envelope.salt !== "string" ||
    typeof envelope.iv !== "string" ||
    typeof envelope.ciphertext !== "string"
  ) {
    throw new CryptoInputError("Versi atau parameter ciphertext MKE1 tidak didukung.");
  }

  const salt = base64ToBytes(envelope.salt);
  const iv = base64ToBytes(envelope.iv);
  const encrypted = base64ToBytes(envelope.ciphertext);

  if (salt.length !== SALT_LENGTH || iv.length !== IV_LENGTH || encrypted.length < TAG_LENGTH / 8) {
    throw new CryptoInputError("Struktur ciphertext MKE1 tidak valid.");
  }
  if (encrypted.length > MAX_TEXT_BYTES + TAG_LENGTH / 8) {
    throw new CryptoInputError("Ciphertext terlalu besar untuk diproses.");
  }

  const key = await deriveKey(password, salt, 256);
  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: toArrayBuffer(iv),
        additionalData: toArrayBuffer(LEGACY_AAD),
        tagLength: TAG_LENGTH,
      },
      key,
      toArrayBuffer(encrypted),
    );
    return new TextDecoder("utf-8", { fatal: true }).decode(decrypted);
  } catch {
    throw new Error("Dekripsi gagal. Kata sandi salah atau ciphertext telah diubah/rusak.");
  }
}

async function decryptCompactMke2(normalized: string, password: string): Promise<string> {
  const binary = base64UrlToBytes(normalized.slice(COMPACT_PREFIX.length));
  if (binary.length < 4 + SALT_LENGTH + IV_LENGTH + TAG_LENGTH / 8) {
    throw new CryptoInputError("Ciphertext MKE2 terlalu pendek atau tidak lengkap.");
  }

  const version = binary[0];
  const algorithmCode = binary[1];
  const saltLength = binary[2];
  const ivLength = binary[3];

  if (version !== FORMAT_VERSION || (algorithmCode !== 1 && algorithmCode !== 2)) {
    throw new CryptoInputError("Versi atau algoritma ciphertext MKE2 tidak didukung.");
  }
  if (saltLength !== SALT_LENGTH || ivLength !== IV_LENGTH) {
    throw new CryptoInputError("Parameter salt atau IV pada ciphertext MKE2 tidak valid.");
  }

  const keyLength: 128 | 256 = algorithmCode === 1 ? 256 : 128;
  const expectedHeaderLength = 4 + saltLength + ivLength;
  const encryptedLength = binary.length - expectedHeaderLength;
  if (encryptedLength < TAG_LENGTH / 8 || encryptedLength > MAX_TEXT_BYTES + TAG_LENGTH / 8) {
    throw new CryptoInputError("Ukuran ciphertext MKE2 tidak valid.");
  }

  const salt = binary.slice(4, 4 + saltLength);
  const iv = binary.slice(4 + saltLength, expectedHeaderLength);
  const encrypted = binary.slice(expectedHeaderLength);
  const key = await deriveKey(password, salt, keyLength);

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: toArrayBuffer(iv),
        additionalData: toArrayBuffer(aadFor(keyLength)),
        tagLength: TAG_LENGTH,
      },
      key,
      toArrayBuffer(encrypted),
    );
    return new TextDecoder("utf-8", { fatal: true }).decode(decrypted);
  } catch {
    throw new Error("Dekripsi gagal. Kata sandi salah atau ciphertext telah diubah/rusak.");
  }
}

export async function decryptText(ciphertext: string, password: string): Promise<string> {
  requireWebCrypto();
  validatePassword(password);

  const normalized = ciphertext.trim();
  if (normalized.length > MAX_ENVELOPE_CHARS) {
    throw new CryptoInputError("Ciphertext terlalu besar untuk diproses.");
  }

  if (normalized.startsWith(LEGACY_PREFIX)) {
    return decryptLegacyMke1(normalized, password);
  }
  if (normalized.startsWith(COMPACT_PREFIX)) {
    return decryptCompactMke2(normalized, password);
  }
  throw new CryptoInputError("Format tidak dikenali. Gunakan ciphertext MKE1 atau MKE2 dari Mikhayl Encrypter.");
}