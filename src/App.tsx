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

  const inputLabel = mode === "encrypt" ? "Plain text" : "Encrypted text";
  const outputLabel = mode === "encrypt" ? "Encrypted output" : "Decrypted output";
  const inputPlaceholder = mode === "encrypt"
    ? "Tulis atau tempel pesan yang ingin kamu enkripsi..."
    : "Tempel ciphertext MKE1 yang ingin kamu dekripsi...";
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

  const canSubmit = input.trim().length > 0 && Array.from(password).length >= 8 && !busy;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Mikhayl Encrypter home">
          <span className="brand-mark"><ShieldCheck size={21} strokeWidth={2.2} /></span>
          <span className="brand-name">mikhayl<span>encrypter</span></span>
        </a>
        <div className="topbar-right">
          <span className="privacy-pill"><span className="privacy-dot" /> Private by design</span>
          <a className="github-link" href="https://github.com/Mikhayl-05/Encrypter" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a>
        </div>
      </header>

      <main>
        <section className="intro">
          <div className="eyebrow"><Sparkles size={14} /> SIMPLE. PRIVATE. SECURE.</div>
          <h1>Your text.<br /><span>Your privacy.</span></h1>
          <p className="intro-copy">Encrypt and decrypt messages with strong, modern cryptography.<br className="desktop-break" /> Your text stays in your browser. Nothing is uploaded.</p>
          <div className="algorithm-chip"><span className="chip-icon"><LockKeyhole size={14} /></span> AES-256-GCM <span className="chip-divider" /> PBKDF2-SHA-256</div>
        </section>

        <section className="workspace" aria-label="Text encryption tool">
          <div className="workspace-top">
            <div className="tabs" role="tablist" aria-label="Encryption mode">
              <button className={mode === "encrypt" ? "tab active" : "tab"} onClick={() => changeMode("encrypt")} role="tab" aria-selected={mode === "encrypt"}>
                <LockKeyhole size={16} /> Encrypt
              </button>
              <button className={mode === "decrypt" ? "tab active" : "tab"} onClick={() => changeMode("decrypt")} role="tab" aria-selected={mode === "decrypt"}>
                <RefreshCw size={16} /> Decrypt
              </button>
            </div>
            <button className="clear-button" onClick={clearAll} type="button"><X size={14} /> Clear</button>
          </div>

          <div className="workspace-grid">
            <div className="input-column">
              <div className="field-heading">
                <label htmlFor="source-text">{inputLabel}</label>
                <span className="field-meta">{inputLength.toLocaleString("en-US")} bytes</span>
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
                <label htmlFor="password">Password</label>
                <span className={Array.from(password).length >= 8 ? "password-hint valid" : "password-hint"}>
                  {Array.from(password).length >= 8 ? "Good to go" : "At least 8 characters"}
                </span>
              </div>
              <div className="password-wrap">
                <LockKeyhole className="password-icon" size={17} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => { setPassword(event.target.value); setError(""); setNotice(""); setResult(""); }}
                  placeholder="Enter a strong password"
                  autoComplete="new-password"
                  maxLength={1024}
                />
                <button className="visibility-button" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <div className="password-note"><ShieldCheck size={14} /> Your password is never stored or sent anywhere.</div>

              <button className="primary-button" onClick={handleSubmit} disabled={!canSubmit} type="button">
                {busy ? <span className="spinner" /> : mode === "encrypt" ? <LockKeyhole size={17} /> : <RefreshCw size={17} />}
                {busy ? "Processing..." : mode === "encrypt" ? "Encrypt text" : "Decrypt text"}
                {!busy && <span className="button-shortcut">↗</span>}
              </button>
              <p className="button-caption">Processed locally using your browser's cryptography engine.</p>
            </div>

            <div className="output-column">
              <div className="field-heading">
                <label>{outputLabel}</label>
                {result && <span className="result-ready"><CheckCircle2 size={13} /> Ready</span>}
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
                  {copied ? "Copied" : "Copy"}
                </button>
                <button className="secondary-button" type="button" onClick={downloadResult} disabled={!result}>
                  <ArrowDownToLine size={16} /> Download
                </button>
              </div>

              {error ? (
                <div className="message message-error" role="alert"><X size={15} /> <span>{error}</span></div>
              ) : notice ? (
                <div className="message message-success" role="status"><CheckCircle2 size={15} /> <span>{notice}</span></div>
              ) : (
                <div className="output-footnote"><Clipboard size={14} /> {mode === "encrypt" ? "Keep your password safe. It cannot be recovered." : "Only the correct password can unlock this text."}</div>
              )}
            </div>
          </div>
        </section>

        <section className="trust-row">
          <div className="trust-item"><span className="trust-icon"><ShieldCheck size={17} /></span><div><strong>Client-side encryption</strong><span>Data never leaves your device</span></div></div>
          <div className="trust-item"><span className="trust-icon"><LockKeyhole size={17} /></span><div><strong>Authenticated encryption</strong><span>Changes to ciphertext are detected</span></div></div>
          <div className="trust-item"><span className="trust-icon"><ArrowLeftRight size={17} /></span><div><strong>Encrypt & decrypt</strong><span>One password, both directions</span></div></div>
        </section>

        <section className="how-section">
          <div className="how-title"><span>HOW IT WORKS</span><span className="how-line" /></div>
          <div className="how-content">
            <p><strong>AES-256-GCM</strong> encrypts your text and verifies its integrity. A fresh random salt and 96-bit IV are generated for every encryption. Your password is converted into a 256-bit key with <strong>PBKDF2-SHA-256</strong> (600,000 iterations).</p>
            <p className="format-note"><span className="format-tag">MKE1</span> Ciphertext uses a versioned format so the app can validate its algorithm parameters before decryption.</p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <a className="footer-brand" href="/">Mikhayl Encrypter</a>
        <span>Made for privacy. Runs in your browser.</span>
        <span className="footer-version">AES-256-GCM · v1.0</span>
      </footer>
    </div>
  );
}

export default App;