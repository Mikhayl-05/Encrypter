# Mikhayl Encrypter

A clean, browser-based text encryption tool powered by **AES-256-GCM** and **PBKDF2-SHA-256**. Designed with a white and blue interface. All encryption and decryption happen locally in the browser through the Web Crypto API.

## Features

- AES-256-GCM authenticated encryption
- PBKDF2-SHA-256 key derivation with 600,000 iterations
- Fresh cryptographically random 16-byte salt and 12-byte IV for every encryption
- 128-bit GCM authentication tag
- Versioned `MKE1` ciphertext envelope with strict parameter validation
- Encrypt, decrypt, copy, and download text
- No backend, database, account, or API key
- Responsive desktop and mobile interface

## Run locally

Requirements: Node.js 20 or later.

```bash
npm install
npm run dev
```

Create a production build:

```bash
npm run build
npm run preview
```

## Cryptographic format

The output is prefixed with `MKE1.` and contains a Base64-encoded JSON envelope. The envelope stores the version, algorithm identifiers, PBKDF2 iteration count, salt, IV, and AES-GCM ciphertext (including its authentication tag).

The password is normalized with Unicode NFKC and used as PBKDF2 input. PBKDF2 derives a 256-bit AES key. The fixed application context string is authenticated as additional authenticated data (AAD). Decryption checks the envelope format and exact supported parameters before deriving the key.

## Security notes

- **Keep your password safe.** There is no password recovery mechanism.
- A ciphertext is not a password-protected file unless you keep the password secret.
- The encryption is performed in the browser. The app has no code that sends plaintext, ciphertext, or passwords to a server. Hosting providers still serve the website's static application files.
- Use a trusted device and a current browser. A compromised device or malicious browser extension can access text while it is being entered or displayed.
- The Base64 representation is only a transport format; security comes from AES-256-GCM and a strong password.
- This project is a practical text-encryption utility, not a substitute for a security audit or a managed secret-storage system.

## Stack

React · TypeScript · Vite · Web Crypto API · lucide-react

## License

No license has been added yet. All rights remain with the repository owner unless a license is added.
