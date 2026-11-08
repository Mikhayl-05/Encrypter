# Mikhayl Encrypter

Mikhayl Encrypter adalah alat untuk mengenkripsi, mendekripsi, dan mempelajari sandi teks langsung di browser. Aplikasi menyediakan enkripsi modern untuk perlindungan data serta sandi klasik untuk pembelajaran.

## Algoritma yang tersedia

### Enkripsi modern

- **AES-256-GCM** — algoritma default dengan kunci 256-bit dan authentication tag 128-bit.
- **AES-128-GCM** — pilihan AES-GCM dengan kunci 128-bit.

Keduanya menggunakan **PBKDF2-SHA-256** dengan 600.000 iterasi, salt acak 16 byte, IV acak 12 byte, dan format ringkas **MKE2** menggunakan Base64URL. Format MKE2 menyimpan header biner kecil, bukan envelope JSON, untuk mengurangi panjang teks hasil enkripsi.

### Sandi klasik untuk pembelajaran

- **Caesar Cipher** — pergeseran huruf dengan nilai 0–25.
- **ROT13** — pergeseran alfabet sebanyak 13 posisi.
- **Atbash** — membalik urutan alfabet.
- **Vigenère Cipher** — pergeseran huruf berdasarkan kunci alfabet.
- **Rail Fence Cipher** — transposisi karakter menggunakan pola zig-zag dengan 2–20 rel.

**Peringatan:** sandi klasik bukan enkripsi modern dan tidak aman untuk melindungi informasi sensitif. Gunakan AES-256-GCM atau AES-128-GCM untuk data rahasia. Jangan gunakan Caesar, ROT13, Atbash, Vigenère, atau Rail Fence untuk password, dokumen pribadi, atau informasi penting.

## Kompatibilitas ciphertext

- Enkripsi AES baru menghasilkan format ringkas `MKE2.`.
- Dekripsi tetap mendukung format lama `MKE1.` yang pernah dibuat oleh versi sebelumnya.
- Sandi klasik menghasilkan teks transformasi biasa. Untuk membaliknya, pilih algoritma yang sama dan gunakan kembali nilai pergeseran, jumlah rel, atau kunci yang sama.
- Format MKE1 hanya digunakan untuk AES-256-GCM versi lama. Format MKE2 mendukung AES-256-GCM dan AES-128-GCM.

## Menjalankan secara lokal

Persyaratan: Node.js 20 atau lebih baru.

```bash
npm install
npm run dev
```

Membuat build produksi:

```bash
npm run build
npm run preview
```

## Catatan keamanan

- Semua transformasi dan proses enkripsi/dekripsi berlangsung di browser melalui Web Crypto API atau kode sandi klasik lokal. Tidak ada backend atau database.
- Kata sandi AES minimal satu karakter sesuai persyaratan antarmuka, tetapi kata sandi pendek sangat mudah ditebak. Gunakan frasa sandi panjang, unik, dan acak untuk data penting.
- Salt dan IV dibuat secara acak menggunakan `crypto.getRandomValues()` untuk setiap enkripsi AES.
- AES-GCM memverifikasi authentication tag sebelum plaintext dikeluarkan. Password yang salah atau ciphertext yang diubah akan menyebabkan dekripsi gagal.
- Base64URL hanya format representasi teks, bukan mekanisme keamanan.
- Perangkat yang terinfeksi malware, ekstensi berbahaya, atau browser yang telah disusupi dapat membaca teks ketika sedang dimasukkan atau ditampilkan.
- Aplikasi tidak menyimpan password, teks asli, atau ciphertext ke penyimpanan aplikasi. Browser atau pengelola password tetap dapat menerapkan kebijakan autofill sendiri.

## Teknologi

React · TypeScript · Vite · Web Crypto API · lucide-react

## Lisensi

Belum ada lisensi yang ditambahkan. Seluruh hak tetap berada pada pemilik repository kecuali lisensi ditambahkan.
