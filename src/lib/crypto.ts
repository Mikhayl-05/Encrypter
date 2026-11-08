const FORMAT_PREFIX = "MKE1.";
const FORMAT_VERSION = 1;
const ITERATIONS = 600_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 128;
const MAX_TEXT_BYTES = 5 * 1024 * 1024;
const MAX_ENVELOPE_CHARS = 8_000_000;
const ADDITIONAL_DATA = new TextEncoder().encode("Mikhayl Encrypter|MKE1");

type CipherEnvelope = {
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
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    throw new CryptoInputError("Format ciphertext tidak valid atau rusak.");
  }
}


function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function requireWebCrypto(): void {
  if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) {
    throw new Error("Browser ini tidak mendukung Web Crypto API. Gunakan browser modern melalui koneksi HTTPS.");
  }
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const passwordBytes = new TextEncoder().encode(password.normalize("NFKC"));
  const material = await crypto.subtle.importKey("raw", toArrayBuffer(passwordBytes), "PBKDF2", false, ["deriveKey"]);

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: toArrayBuffer(salt),
      iterations: ITERATIONS,
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function validateText(text: string): Uint8Array {
  const encoded = new TextEncoder().encode(text);
  if (encoded.length === 0) {
    throw new CryptoInputError("Masukkan teks terlebih dahulu.");
  }
  if (encoded.length > MAX_TEXT_BYTES) {
    throw new CryptoInputError("Ukuran teks maksimal 5 MB.");
  }
  return encoded;
}

export function validatePassword(password: string): void {
  if (Array.from(password).length < 1) {
    throw new CryptoInputError("Kata sandi wajib diisi minimal 1 karakter.");
  }
  if (password.length > 1024) {
    throw new CryptoInputError("Password terlalu panjang (maksimal 1.024 karakter).");
  }
}

export async function encryptText(plaintext: string, password: string): Promise<string> {
  requireWebCrypto();
  validatePassword(password);
  const plaintextBytes = validateText(plaintext);

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: toArrayBuffer(iv),
      additionalData: toArrayBuffer(ADDITIONAL_DATA),
      tagLength: TAG_LENGTH,
    },
    key,
    toArrayBuffer(plaintextBytes),
  );

  const envelope: CipherEnvelope = {
    v: FORMAT_VERSION,
    alg: "AES-256-GCM",
    kdf: "PBKDF2-SHA-256",
    iterations: ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
  };

  const serialized = new TextEncoder().encode(JSON.stringify(envelope));
  return FORMAT_PREFIX + bytesToBase64(serialized);
}

export async function decryptText(ciphertext: string, password: string): Promise<string> {
  requireWebCrypto();
  validatePassword(password);

  const normalized = ciphertext.trim();
  if (!normalized.startsWith(FORMAT_PREFIX)) {
    throw new CryptoInputError("Format tidak dikenali. Ciphertext Mikhayl Encrypter harus diawali dengan MKE1.");
  }
  if (normalized.length > MAX_ENVELOPE_CHARS) {
    throw new CryptoInputError("Ciphertext terlalu besar untuk diproses.");
  }

  const encodedEnvelope = base64ToBytes(normalized.slice(FORMAT_PREFIX.length));
  let envelope: CipherEnvelope;

  try {
    envelope = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(encodedEnvelope)) as CipherEnvelope;
  } catch {
    throw new CryptoInputError("Ciphertext tidak valid atau telah rusak.");
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
    throw new CryptoInputError("Versi atau parameter ciphertext tidak didukung.");
  }

  const salt = base64ToBytes(envelope.salt);
  const iv = base64ToBytes(envelope.iv);
  const encryptedBytes = base64ToBytes(envelope.ciphertext);

  if (salt.length !== SALT_LENGTH || iv.length !== IV_LENGTH || encryptedBytes.length < TAG_LENGTH / 8) {
    throw new CryptoInputError("Struktur ciphertext tidak valid atau telah rusak.");
  }

  const key = await deriveKey(password, salt);

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: toArrayBuffer(iv),
        additionalData: toArrayBuffer(ADDITIONAL_DATA),
        tagLength: TAG_LENGTH,
      },
      key,
      toArrayBuffer(encryptedBytes),
    );

    return new TextDecoder("utf-8", { fatal: true }).decode(decrypted);
  } catch {
    throw new Error("Dekripsi gagal. Password salah atau ciphertext telah diubah/rusak.");
  }
}