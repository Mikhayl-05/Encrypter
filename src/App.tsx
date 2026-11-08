import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  Check,
  CheckCircle2,
  Clipboard,
  Copy,
  Eye,
  EyeOff,
  FileText,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { CryptoInputError, decryptText, encryptText } from "./lib/crypto";
import { transformClassical, type ClassicalAlgorithm } from "./lib/classical";

type Mode = "encrypt" | "decrypt";
type Algorithm = "aes-256-gcm" | "aes-128-gcm" | ClassicalAlgorithm;

const algorithmInfo: Record<Algorithm, { label: string; description: string; secure: boolean }> = {
  "aes-256-gcm": {
    label: "AES-256-GCM",
    description: "Enkripsi modern terautentikasi dengan kunci 256-bit. Format MKE2 dirancang lebih ringkas.",
    secure: true,
  },
  "aes-128-gcm": {
    label: "AES-128-GCM",
    description: "Enkripsi modern terautentikasi dengan kunci 128-bit. Cepat dan tetap kuat untuk penggunaan umum.",
    secure: true,
  },
  caesar: {
    label: "Caesar Cipher",
    description: "Menggeser setiap huruf berdasarkan angka tertentu. Sandi klasik untuk belajar, bukan untuk menjaga kerahasiaan.",
    secure: false,
  },
  rot13: {
    label: "ROT13",
    description: "Menggeser setiap huruf sebanyak 13 posisi. Proses yang sama digunakan untuk enkripsi dan dekripsi.",
    secure: false,
  },
  atbash: {
    label: "Atbash",
    description: "Membalik urutan alfabet: A menjadi Z, B menjadi Y, dan seterusnya.",
    secure: false,
  },
  vigenere: {
    label: "Vigenère Cipher",
    description: "Menggunakan kata kunci huruf untuk menentukan pergeseran tiap huruf. Mudah dipelajari, tetapi tidak aman untuk data rahasia.",
    secure: false,
  },
  "rail-fence": {
    label: "Rail Fence Cipher",
    description: "Mengacak urutan karakter dengan pola zig-zag pada beberapa rel. Ini adalah sandi transposisi klasik.",
    secure: false,
  },
};

const modernAlgorithms: Algorithm[] = ["aes-256-gcm", "aes-128-gcm"];
const classicalAlgorithms: Algorithm[] = ["caesar", "rot13", "atbash", "vigenere", "rail-fence"];

function App() {
  const [mode, setMode] = useState<Mode>("encrypt");
  const [algorithm, setAlgorithm] = useState<Algorithm>("aes-256-gcm");
  const [input, setInput] = useState("");
  const [secret, setSecret] = useState("");
  const [parameter, setParameter] = useState(3);
  const [result, setResult] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);

  const isModern = modernAlgorithms.includes(algorithm);
  const usesSecret = isModern || algorithm === "vigenere";
  const usesParameter = algorithm === "caesar" || algorithm === "rail-fence";
  const selectedInfo = algorithmInfo[algorithm];
  const inputLabel = mode === "encrypt" ? "Teks asli" : "Teks untuk didekripsi";
  const outputLabel = mode === "encrypt" ? "Hasil enkripsi" : "Hasil dekripsi";

  const inputPlaceholder = mode === "encrypt"
    ? "Tulis atau tempel teks yang ingin diproses..."
    : isModern
      ? "Tempel ciphertext MKE1 atau MKE2 di sini..."
      : "Tempel hasil sandi yang ingin dikembalikan ke teks asli...";
  const outputPlaceholder = mode === "encrypt"
    ? "Hasil enkripsi akan muncul di sini."
    : "Hasil dekripsi akan muncul di sini.";
  const inputLength = useMemo(() => new TextEncoder().encode(input).length, [input]);

  function changeMode(nextMode: Mode) {
    if (nextMode === mode) return;
    if (result) setInput(result);
    setResult("");
    setError("");
    setNotice("");
    setCopied(false);
    setMode(nextMode);
  }

  function changeAlgorithm(nextAlgorithm: Algorithm) {
    setAlgorithm(nextAlgorithm);
    setSecret("");
    setShowSecret(false);
    setResult("");
    setError("");
    setNotice("");
    setCopied(false);
  }

  function updateInput(value: string) {
    setInput(value);
    setError("");
    setNotice("");
    setResult("");
    setCopied(false);
  }

  async function handleSubmit() {
    setError("");
    setNotice("");
    setResult("");
    setCopied(false);
    setBusy(true);

    try {
      let output: string;
      if (isModern) {
        const keyLength = algorithm === "aes-128-gcm" ? 128 : 256;
        output = mode === "encrypt"
          ? await encryptText(input, secret, keyLength)
          : await decryptText(input, secret);
      } else {
        output = transformClassical(
          input,
          algorithm,
          mode === "decrypt",
          parameter,
          secret,
        );
      }

      setResult(output);
      setNotice(
        isModern
          ? mode === "encrypt"
            ? `Teks berhasil dienkripsi dengan ${selectedInfo.label} (format ringkas MKE2).`
            : "Teks berhasil didekripsi. Keutuhan ciphertext berhasil diverifikasi."
          : mode === "encrypt"
            ? `Teks berhasil diproses dengan ${selectedInfo.label}. Sandi klasik tidak aman untuk data rahasia.`
            : `Teks berhasil dikembalikan menggunakan ${selectedInfo.label}.`,
      );
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Terjadi kesalahan yang tidak diketahui.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function copyResult() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Akses clipboard tidak tersedia. Salin hasil secara manual.");
    }
  }

  function downloadResult() {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `mikhayl-${algorithm}-${mode === "encrypt" ? "terenkripsi" : "terdekripsi"}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function clearAll() {
    setInput("");
    setSecret("");
    setResult("");
    setError("");
    setNotice("");
    setCopied(false);
  }

  const secretLength = Array.from(secret).length;
  const canSubmit = input.trim().length > 0 && (!usesSecret || secretLength >= 1) && !busy;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Beranda Mikhayl Encrypter">
          <span className="brand-mark"><ShieldCheck size={21} strokeWidth={2.2} /></span>
          <span className="brand-name">mikhayl<span>encrypter</span></span>
        </a>
        <div className="topbar-right">
          <span className="privacy-pill"><span className="privacy-dot" /> Diproses di perangkat</span>
          <a className="github-link" href="https://github.com/Mikhayl-05/Encrypter" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a>
        </div>
      </header>

      <main>
        <section className="intro">
          <div className="eyebrow"><Sparkles size={14} /> ENKRIPSI MODERN & SANDI KLASIK</div>
          <h1>Teks kamu.<br /><span>Privasi kamu.</span></h1>
          <p className="intro-copy">Pilih enkripsi modern untuk melindungi data, atau sandi klasik<br className="desktop-break" /> untuk bereksperimen dan mempelajari kriptografi.</p>
          <div className="algorithm-chip"><span className="chip-icon"><LockKeyhole size={14} /></span> AES-GCM <span className="chip-divider" /> SANDI KLASIK</div>
        </section>

        <section className="workspace" aria-label="Alat enkripsi dan sandi teks">
          <div className="workspace-top">
            <div className="tabs" role="tablist" aria-label="Mode proses">
              <button className={mode === "encrypt" ? "tab active" : "tab"} onClick={() => changeMode("encrypt")} role="tab" aria-selected={mode === "encrypt"}>
                <LockKeyhole size={16} /> Enkripsi
              </button>
              <button className={mode === "decrypt" ? "tab active" : "tab"} onClick={() => changeMode("decrypt")} role="tab" aria-selected={mode === "decrypt"}>
                <RefreshCw size={16} /> Dekripsi
              </button>
            </div>
            <button className="clear-button" onClick={clearAll} type="button"><X size={14} /> Hapus</button>
          </div>

          <div className="algorithm-panel">
            <div className="algorithm-select-wrap">
              <label htmlFor="algorithm-select">PILIH ALGORITMA</label>
              <select
                id="algorithm-select"
                className="algorithm-select"
                value={algorithm}
                onChange={(event) => changeAlgorithm(event.target.value as Algorithm)}
              >
                <optgroup label="Enkripsi modern — untuk perlindungan data">
                  <option value="aes-256-gcm">AES-256-GCM · Format ringkas MKE2</option>
                  <option value="aes-128-gcm">AES-128-GCM · Format ringkas MKE2</option>
                </optgroup>
                <optgroup label="Sandi klasik — untuk belajar dan eksperimen">
                  <option value="caesar">Caesar Cipher</option>
                  <option value="rot13">ROT13</option>
                  <option value="atbash">Atbash Cipher</option>
                  <option value="vigenere">Vigenère Cipher</option>
                  <option value="rail-fence">Rail Fence Cipher</option>
                </optgroup>
              </select>
            </div>
            <div className={selectedInfo.secure ? "algorithm-description" : "algorithm-description algorithm-warning"}>
              <span className="algorithm-status-icon">
                {selectedInfo.secure ? <ShieldCheck size={16} /> : <Zap size={16} />}
              </span>
              <div>
                <strong>{selectedInfo.label}</strong>
                <p>{selectedInfo.description}</p>
              </div>
              <span className={selectedInfo.secure ? "classification-badge secure-badge" : "classification-badge classic-badge"}>
                {selectedInfo.secure ? "Modern" : "Klasik"}
              </span>
            </div>
          </div>

          <div className="workspace-grid">
            <div className="input-column">
              <div className="field-heading">
                <label htmlFor="source-text">{inputLabel}</label>
                <span className="field-meta">{inputLength.toLocaleString("id-ID")} byte</span>
              </div>
              <textarea
                id="source-text"
                className="text-area"
                value={input}
                onChange={(event) => updateInput(event.target.value)}
                placeholder={inputPlaceholder}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
              />

              {usesSecret && (
                <>
                  <div className="password-heading">
                    <label htmlFor="cipher-secret">{isModern ? "Kata sandi" : "Kunci Vigenère"}</label>
                    {isModern && (
                      <span className={secretLength >= 12 ? "password-hint valid" : secretLength > 0 ? "password-hint warning" : "password-hint"}>
                        {secretLength >= 12 ? "Gunakan kata sandi unik" : secretLength > 0 ? "Kata sandi pendek mudah ditebak" : "Minimal 1 karakter"}
                      </span>
                    )}
                  </div>
                  <div className="password-wrap">
                    <LockKeyhole className="password-icon" size={17} />
                    <input
                      id="cipher-secret"
                      type={isModern && !showSecret ? "password" : "text"}
                      value={secret}
                      onChange={(event) => { setSecret(event.target.value); setError(""); setNotice(""); setResult(""); }}
                      placeholder={isModern ? "Masukkan kata sandi" : "Masukkan kunci berisi huruf A-Z"}
                      autoComplete="off"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      maxLength={1024}
                    />
                    {isModern && (
                      <button className="visibility-button" type="button" onClick={() => setShowSecret((value) => !value)} aria-label={showSecret ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>
                        {showSecret ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    )}
                  </div>
                  <div className="password-note">
                    <ShieldCheck size={14} />
                    {isModern
                      ? "Kata sandi hanya dipakai untuk proses ini dan tidak disimpan oleh aplikasi."
                      : "Gunakan kunci huruf A-Z. Vigenère adalah sandi klasik dan mudah dianalisis."}
                  </div>
                </>
              )}

              {usesParameter && (
                <>
                  <div className="password-heading">
                    <label htmlFor="cipher-parameter">{algorithm === "caesar" ? "Pergeseran huruf" : "Jumlah rel"}</label>
                    <span className="password-hint">{algorithm === "caesar" ? "Rentang 0–25" : "Rentang 2–20"}</span>
                  </div>
                  <input
                    id="cipher-parameter"
                    className="parameter-input"
                    type="number"
                    min={algorithm === "caesar" ? 0 : 2}
                    max={algorithm === "caesar" ? 25 : 20}
                    step={1}
                    value={parameter}
                    onChange={(event) => { setParameter(Number(event.target.value)); setError(""); setNotice(""); setResult(""); }}
                  />
                </>
              )}

              {!usesSecret && !usesParameter && (
                <div className="password-note no-key-note">
                  <ShieldCheck size={14} />
                  Algoritma ini tidak membutuhkan kata sandi atau kunci tambahan.
                </div>
              )}

              <button className="primary-button" onClick={handleSubmit} disabled={!canSubmit} type="button">
                {busy ? <span className="spinner" /> : mode === "encrypt" ? <LockKeyhole size={17} /> : <RefreshCw size={17} />}
                {busy ? "Memproses..." : mode === "encrypt" ? "Proses enkripsi" : "Proses dekripsi"}
                {!busy && <span className="button-shortcut">↗</span>}
              </button>
              <p className="button-caption">
                {isModern
                  ? "Diproses secara lokal menggunakan Web Crypto API."
                  : "Hasil sandi klasik harus dibuka dengan algoritma dan parameter yang sama."}
              </p>
            </div>

            <div className="output-column">
              <div className="field-heading">
                <label>{outputLabel}</label>
                {result && <span className="result-ready"><CheckCircle2 size={13} /> Siap</span>}
              </div>
              <div className={result ? "result-box has-result" : "result-box"}>
                {result ? (
                  <pre>{result}</pre>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon"><FileText size={22} /></div>
                    <span>{outputPlaceholder}</span>
                  </div>
                )}
              </div>

              <div className="output-actions">
                <button className="secondary-button" type="button" onClick={copyResult} disabled={!result}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Tersalin" : "Salin"}
                </button>
                <button className="secondary-button" type="button" onClick={downloadResult} disabled={!result}>
                  <ArrowDownToLine size={16} /> Unduh
                </button>
              </div>

              {error ? (
                <div className="message message-error" role="alert"><X size={15} /> <span>{error}</span></div>
              ) : notice ? (
                <div className={isModern ? "message message-success" : "message message-warning"} role="status">
                  {isModern ? <CheckCircle2 size={15} /> : <Zap size={15} />} <span>{notice}</span>
                </div>
              ) : (
                <div className="output-footnote">
                  <Clipboard size={14} />
                  {isModern
                    ? "Ciphertext MKE2 lebih ringkas. Ciphertext lama MKE1 tetap dapat didekripsi."
                    : "Sandi klasik cocok untuk pembelajaran, bukan untuk menyimpan informasi rahasia."}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="trust-row">
          <div className="trust-item"><span className="trust-icon"><ShieldCheck size={17} /></span><div><strong>Diproses di perangkat</strong><span>Teks tidak dikirim ke server</span></div></div>
          <div className="trust-item"><span className="trust-icon"><LockKeyhole size={17} /></span><div><strong>AES-GCM terautentikasi</strong><span>Perubahan ciphertext terdeteksi</span></div></div>
          <div className="trust-item"><span className="trust-icon"><ArrowLeftRight size={17} /></span><div><strong>Enkripsi & dekripsi</strong><span>Gunakan algoritma yang sama</span></div></div>
        </section>

        <section className="how-section">
          <div className="how-title"><span>CARA KERJA</span><span className="how-line" /></div>
          <div className="how-content">
            {isModern ? (
              <>
                <p><strong>{selectedInfo.label}</strong> mengenkripsi teks dan memeriksa keutuhannya melalui authentication tag. Kunci diturunkan dari kata sandi menggunakan <strong>PBKDF2-SHA-256</strong> dengan 600.000 iterasi. Setiap enkripsi memakai salt 16 byte dan IV 12 byte yang dibuat secara acak.</p>
                <p className="format-note"><span className="format-tag">MKE2</span> Format biner ringkas dengan Base64URL. Aplikasi juga tetap mendukung dekripsi format lama MKE1.</p>
              </>
            ) : (
              <>
                <p><strong>{selectedInfo.label}</strong> merupakan metode kriptografi klasik yang bekerja dengan transformasi huruf atau posisi karakter. Metode ini bermanfaat untuk memahami konsep dasar sandi, tetapi tidak memiliki keamanan yang memadai untuk data rahasia.</p>
                <p className="format-note"><span className="format-tag">EDUKASI</span> Untuk melindungi informasi pribadi atau sensitif, pilih AES-256-GCM atau AES-128-GCM.</p>
              </>
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        <a className="footer-brand" href="/">Mikhayl Encrypter</a>
        <span>Enkripsi privat dan alat belajar kriptografi.</span>
        <span className="footer-version">MKE2 · kompatibel MKE1</span>
      </footer>
    </div>
  );
}

export default App;