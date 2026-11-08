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
} from "lucide-react";
import { CryptoInputError, decryptText, encryptText } from "./lib/crypto";

type Mode = "encrypt" | "decrypt";

function App() {
  const [mode, setMode] = useState<Mode>("encrypt");
  const [input, setInput] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);

  const inputLabel = mode === "encrypt" ? "Teks asli" : "Teks terenkripsi";
  const outputLabel = mode === "encrypt" ? "Hasil enkripsi" : "Hasil dekripsi";
  const inputPlaceholder = mode === "encrypt"
    ? "Tulis atau tempel pesan yang ingin kamu enkripsi..."
    : "Tempel teks terenkripsi MKE1 yang ingin kamu dekripsi...";
  const outputPlaceholder = mode === "encrypt"
    ? "Hasil enkripsi akan muncul di sini."
    : "Pesan asli akan muncul di sini.";

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
      const output = mode === "encrypt"
        ? await encryptText(input, password)
        : await decryptText(input, password);
      setResult(output);
      setNotice(mode === "encrypt" ? "Teks berhasil dienkripsi." : "Teks berhasil didekripsi.");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Terjadi kesalahan yang tidak diketahui.";
      setError(cause instanceof CryptoInputError ? message : message);
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
      setError("Clipboard tidak tersedia. Salin hasil secara manual.");
    }
  }

  function downloadResult() {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = mode === "encrypt" ? "mikhayl-encrypted.txt" : "mikhayl-decrypted.txt";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function clearAll() {
    setInput("");
    setPassword("");
    setResult("");
    setError("");
    setNotice("");
    setCopied(false);
  }

  const canSubmit = input.trim().length > 0 && Array.from(password).length >= 1 && !busy;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Beranda Mikhayl Encrypter">
          <span className="brand-mark"><ShieldCheck size={21} strokeWidth={2.2} /></span>
          <span className="brand-name">mikhayl<span>encrypter</span></span>
        </a>
        <div className="topbar-right">
          <span className="privacy-pill"><span className="privacy-dot" /> Dirancang untuk privasi</span>
          <a className="github-link" href="https://github.com/Mikhayl-05/Encrypter" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a>
        </div>
      </header>

      <main>
        <section className="intro">
          <div className="eyebrow"><Sparkles size={14} /> SEDERHANA. PRIVAT. AMAN.</div>
          <h1>Teks kamu.<br /><span>Privasi kamu.</span></h1>
          <p className="intro-copy">Enkripsi dan dekripsi pesan dengan kriptografi modern.<br className="desktop-break" /> Teks kamu tetap di browser dan tidak diunggah ke server.</p>
          <div className="algorithm-chip"><span className="chip-icon"><LockKeyhole size={14} /></span> AES-256-GCM <span className="chip-divider" /> PBKDF2-SHA-256</div>
        </section>

        <section className="workspace" aria-label="Alat enkripsi teks">
          <div className="workspace-top">
            <div className="tabs" role="tablist" aria-label="Mode enkripsi">
              <button className={mode === "encrypt" ? "tab active" : "tab"} onClick={() => changeMode("encrypt")} role="tab" aria-selected={mode === "encrypt"}>
                <LockKeyhole size={16} /> Enkripsi
              </button>
              <button className={mode === "decrypt" ? "tab active" : "tab"} onClick={() => changeMode("decrypt")} role="tab" aria-selected={mode === "decrypt"}>
                <RefreshCw size={16} /> Dekripsi
              </button>
            </div>
            <button className="clear-button" onClick={clearAll} type="button"><X size={14} /> Hapus</button>
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

              <div className="password-heading">
                <label htmlFor="password">Kata sandi</label>
                <span className={Array.from(password).length >= 8 ? "password-hint valid" : Array.from(password).length >= 1 ? "password-hint warning" : "password-hint"}>
                  {Array.from(password).length >= 8 ? "Kata sandi terisi" : Array.from(password).length >= 1 ? "Kata sandi pendek — mudah ditebak" : "Minimal 1 karakter"}
                </span>
              </div>
              <div className="password-wrap">
                <LockKeyhole className="password-icon" size={17} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => { setPassword(event.target.value); setError(""); setNotice(""); setResult(""); }}
                  placeholder="Masukkan kata sandi"
                  autoComplete="off"
                  name="mikhayl-cipher-password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  maxLength={1024}
                />
                <button className="visibility-button" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <div className="password-note"><ShieldCheck size={14} /> Kata sandi hanya digunakan saat proses dan tidak disimpan oleh aplikasi.</div>

              <button className="primary-button" onClick={handleSubmit} disabled={!canSubmit} type="button">
                {busy ? <span className="spinner" /> : mode === "encrypt" ? <LockKeyhole size={17} /> : <RefreshCw size={17} />}
                {busy ? "Memproses..." : mode === "encrypt" ? "Enkripsi teks" : "Dekripsi teks"}
                {!busy && <span className="button-shortcut">↗</span>}
              </button>
              <p className="button-caption">Diproses langsung di browser menggunakan teknologi kriptografi.</p>
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
                <div className="message message-success" role="status"><CheckCircle2 size={15} /> <span>{notice}</span></div>
              ) : (
                <div className="output-footnote"><Clipboard size={14} /> {mode === "encrypt" ? "Simpan kata sandi kamu sendiri. Kata sandi yang hilang tidak dapat dipulihkan." : "Hanya kata sandi yang benar yang dapat membuka teks ini."}</div>
              )}
            </div>
          </div>
        </section>

        <section className="trust-row">
          <div className="trust-item"><span className="trust-icon"><ShieldCheck size={17} /></span><div><strong>Enkripsi di perangkat</strong><span>Data tidak meninggalkan perangkatmu</span></div></div>
          <div className="trust-item"><span className="trust-icon"><LockKeyhole size={17} /></span><div><strong>Enkripsi terautentikasi</strong><span>Perubahan pada teks terenkripsi terdeteksi</span></div></div>
          <div className="trust-item"><span className="trust-icon"><ArrowLeftRight size={17} /></span><div><strong>Enkripsi & dekripsi</strong><span>Satu kata sandi untuk keduanya</span></div></div>
        </section>

        <section className="how-section">
          <div className="how-title"><span>CARA KERJA</span><span className="how-line" /></div>
          <div className="how-content">
            <p><strong>AES-256-GCM</strong> mengenkripsi teks sekaligus memeriksa keutuhannya. Setiap proses enkripsi membuat salt acak dan IV 96-bit yang baru. Kata sandi diolah menjadi kunci 256-bit menggunakan <strong>PBKDF2-SHA-256</strong> (600.000 iterasi).</p>
            <p className="format-note"><span className="format-tag">MKE1</span> Teks terenkripsi menggunakan format berversi agar aplikasi dapat memeriksa parameter algoritma sebelum dekripsi.</p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <a className="footer-brand" href="/">Mikhayl Encrypter</a>
        <span>Dibuat untuk privasi. Berjalan langsung di browser.</span>
        <span className="footer-version">AES-256-GCM · v1.0</span>
      </footer>
    </div>
  );
}

export default App;