# Mikhayl Encrypter

Mikhayl Encrypter adalah alat enkripsi teks berbasis browser dengan **AES-256-GCM** dan **PBKDF2-SHA-256**. Antarmukanya menggunakan dominasi warna putih dengan aksen biru. Semua proses enkripsi dan dekripsi berjalan langsung di browser melalui Web Crypto API.

## Fitur

- Enkripsi terautentikasi AES-256-GCM
- Derivasi kunci PBKDF2-SHA-256 dengan 600.000 iterasi
- Salt acak 16 byte dan IV acak 12 byte yang baru untuk setiap proses enkripsi
- Authentication tag GCM 128-bit
- Format ciphertext berversi `MKE1` dengan validasi parameter yang ketat
- Enkripsi, dekripsi, salin, dan unduh teks
- Tidak memerlukan backend, database, akun, atau API key
- Antarmuka responsif untuk desktop dan perangkat seluler

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

## Format kriptografi

Hasil enkripsi diawali dengan `MKE1.` dan berisi envelope JSON yang di-encode menggunakan Base64. Envelope menyimpan versi, identitas algoritma, jumlah iterasi PBKDF2, salt, IV, serta ciphertext AES-GCM (termasuk authentication tag).

Kata sandi dinormalisasi menggunakan Unicode NFKC dan digunakan sebagai input PBKDF2. PBKDF2 menghasilkan kunci AES 256-bit. String konteks aplikasi yang tetap digunakan sebagai *Additional Authenticated Data* (AAD). Sebelum proses dekripsi, aplikasi memeriksa format envelope dan parameter yang didukung.

## Catatan keamanan

- **Jaga kata sandi dengan baik.** Tidak ada mekanisme pemulihan kata sandi.
- Aplikasi mengizinkan kata sandi minimal satu karakter sesuai kebutuhan penggunaan. Namun, kata sandi yang pendek sangat mudah ditebak dan dapat membuat data lebih rentan terhadap serangan tebak kata sandi. Gunakan kata sandi panjang dan unik untuk data penting.
- Enkripsi berlangsung di browser. Kode aplikasi tidak mengirim teks asli, ciphertext, atau kata sandi ke server dan tidak menyimpannya ke penyimpanan aplikasi.
- Kolom kata sandi menggunakan petunjuk `autocomplete="off"` dan tidak didesain sebagai formulir login. Browser atau pengelola kata sandi masih dapat mengabaikan petunjuk ini dan menampilkan prompt penyimpanan sendiri.
- Gunakan perangkat tepercaya dan browser versi terbaru. Perangkat yang telah disusupi atau ekstensi browser berbahaya dapat mengakses teks saat sedang diketik atau ditampilkan.
- Representasi Base64 hanya format penyajian data; keamanan berasal dari AES-256-GCM dan kualitas kata sandi.
- Proyek ini merupakan alat enkripsi teks praktis, bukan pengganti audit keamanan atau sistem penyimpanan rahasia terkelola.

## Teknologi

React · TypeScript · Vite · Web Crypto API · lucide-react

## Lisensi

Belum ada lisensi yang ditambahkan. Seluruh hak tetap berada pada pemilik repository kecuali lisensi ditambahkan.
