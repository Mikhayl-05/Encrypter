export type ClassicalAlgorithm = "caesar" | "rot13" | "atbash" | "vigenere" | "rail-fence";

const MAX_TEXT_BYTES = 5 * 1024 * 1024;

function validateInput(input: string): void {
  if (input.length === 0) throw new Error("Masukkan teks terlebih dahulu.");
  if (new TextEncoder().encode(input).length > MAX_TEXT_BYTES) {
    throw new Error("Ukuran teks maksimal 5 MB.");
  }
}

function shiftLetters(input: string, amount: number): string {
  const shift = ((amount % 26) + 26) % 26;
  return input.replace(/[A-Za-z]/g, (letter) => {
    const base = letter >= "a" && letter <= "z" ? 97 : 65;
    return String.fromCharCode(((letter.charCodeAt(0) - base + shift) % 26) + base);
  });
}

function atbash(input: string): string {
  return input.replace(/[A-Za-z]/g, (letter) => {
    const base = letter >= "a" && letter <= "z" ? 97 : 65;
    return String.fromCharCode(base + (25 - (letter.charCodeAt(0) - base)));
  });
}

function vigenere(input: string, key: string, decrypt: boolean): string {
  const normalizedKey = key.toUpperCase().replace(/[^A-Z]/g, "");
  if (!normalizedKey) {
    throw new Error("Kunci Vigenère harus memiliki setidaknya satu huruf A–Z.");
  }

  let keyIndex = 0;
  return input.replace(/[A-Za-z]/g, (letter) => {
    const base = letter >= "a" && letter <= "z" ? 97 : 65;
    const keyShift = normalizedKey.charCodeAt(keyIndex % normalizedKey.length) - 65;
    keyIndex += 1;
    return String.fromCharCode(
      base + (((letter.charCodeAt(0) - base + (decrypt ? -keyShift : keyShift)) % 26) + 26) % 26,
    );
  });
}

function railPattern(length: number, rails: number): number[] {
  const pattern: number[] = [];
  let rail = 0;
  let direction = 1;
  for (let index = 0; index < length; index += 1) {
    pattern.push(rail);
    if (rail === 0) direction = 1;
    else if (rail === rails - 1) direction = -1;
    rail += direction;
  }
  return pattern;
}

function railFenceEncrypt(input: string, rails: number): string {
  if (rails === 1 || input.length <= 1) return input;
  const rows = Array.from({ length: rails }, () => [] as string[]);
  const pattern = railPattern(input.length, rails);
  for (let index = 0; index < input.length; index += 1) rows[pattern[index]].push(input[index]);
  return rows.map((row) => row.join("")).join("");
}

function railFenceDecrypt(input: string, rails: number): string {
  if (rails === 1 || input.length <= 1) return input;
  const pattern = railPattern(input.length, rails);
  const rowCounts = Array.from({ length: rails }, () => 0);
  for (const rail of pattern) rowCounts[rail] += 1;

  const rows: string[][] = [];
  let cursor = 0;
  for (const count of rowCounts) {
    rows.push(Array.from(input.slice(cursor, cursor + count)));
    cursor += count;
  }

  const rowOffsets = Array.from({ length: rails }, () => 0);
  return pattern.map((rail) => {
    const character = rows[rail][rowOffsets[rail]];
    rowOffsets[rail] += 1;
    return character;
  }).join("");
}

export function transformClassical(
  input: string,
  algorithm: ClassicalAlgorithm,
  decrypt: boolean,
  parameter: number,
  key: string,
): string {
  validateInput(input);

  switch (algorithm) {
    case "caesar": {
      if (!Number.isInteger(parameter) || parameter < 0 || parameter > 25) {
        throw new Error("Pergeseran Caesar harus berupa angka 0 sampai 25.");
      }
      return shiftLetters(input, decrypt ? -parameter : parameter);
    }
    case "rot13":
      return shiftLetters(input, 13);
    case "atbash":
      return atbash(input);
    case "vigenere":
      return vigenere(input, key, decrypt);
    case "rail-fence": {
      if (!Number.isInteger(parameter) || parameter < 2 || parameter > 20) {
        throw new Error("Jumlah rel harus berupa angka 2 sampai 20.");
      }
      return decrypt ? railFenceDecrypt(input, parameter) : railFenceEncrypt(input, parameter);
    }
  }
}