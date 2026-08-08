// Minimal QR encoder — byte mode, error-correction level L, versions 1–40.
//
// Written locally on purpose: the share URL contains the person's answers, so it
// must not be sent to a QR-image web service (the previous implementation posted
// it to api.qrserver.com). Renders to an SVG string, which scales cleanly on the
// card and in print.
//
// Density note: a long share payload pushes the version up, and a 40-version code
// (177 modules) is hard to scan off a screen. Callers should treat a thrown error
// or a large `version` as "show the link instead".

// EC level L, as the 2-bit indicator used in the format information (L is 01, not 00).
const EC_L_BITS = 0b01;

// Data codewords available per version at EC level L.
const DATA_CODEWORDS_L = [
  19, 34, 55, 80, 108, 136, 156, 194, 232, 274, 324, 370, 428, 461, 523, 589, 647, 721, 795, 861,
  932, 1006, 1094, 1174, 1276, 1370, 1468, 1531, 1631, 1735, 1843, 1955, 2071, 2191, 2306, 2434,
  2566, 2702, 2812, 2956,
];

// EC codewords per block at level L.
const EC_PER_BLOCK_L = [
  7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28,
  28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
];

// Block counts [group 1, group 2] at level L. Group 2 blocks hold one more
// data codeword than group 1, which is what `shortLen` below relies on.
const BLOCKS_L = [
  [1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [2, 0], [2, 0], [2, 0], [2, 0], [2, 2],
  [4, 0], [2, 2], [4, 0], [3, 1], [5, 1], [5, 1], [1, 5], [5, 1], [3, 4], [3, 5],
  [4, 4], [2, 7], [4, 5], [6, 4], [8, 4], [10, 2], [8, 4], [3, 10], [7, 7], [5, 10],
  [13, 3], [17, 0], [17, 1], [13, 6], [12, 7], [6, 14], [17, 4], [4, 18], [20, 4], [19, 6],
];

const ALIGNMENT_POS = [
  [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46],
  [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70],
  [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90],
  [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102], [6, 28, 54, 80, 106],
  [6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118], [6, 26, 50, 74, 98, 122],
  [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134],
  [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146],
  [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158],
  [6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170],
];

// ── GF(256) arithmetic for Reed–Solomon ─────────────────────────────────────
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

/** Generator polynomial (x - α⁰)(x - α¹)…, coefficients high degree first. */
function rsGenerator(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data, ecLen) {
  const gen = rsGenerator(ecLen);
  const res = new Uint8Array(ecLen);
  for (const byte of data) {
    const factor = byte ^ res[0];
    res.copyWithin(0, 1);
    res[ecLen - 1] = 0;
    for (let i = 0; i < ecLen; i++) res[i] ^= gfMul(gen[i + 1], factor);
  }
  return res;
}

// ── Bit stream ──────────────────────────────────────────────────────────────
class BitBuffer {
  constructor() { this.bits = []; }
  put(value, length) {
    for (let i = length - 1; i >= 0; i--) this.bits.push((value >>> i) & 1);
  }
  get length() { return this.bits.length; }
  toBytes() {
    const bytes = new Uint8Array(Math.ceil(this.bits.length / 8));
    this.bits.forEach((bit, i) => { if (bit) bytes[i >> 3] |= 0x80 >> (i & 7); });
    return bytes;
  }
}

/** Byte-mode character count field: 8 bits below version 10, 16 bits from 10 up. */
function charCountBits(version) {
  return version < 10 ? 8 : 16;
}

function pickVersion(byteLen) {
  for (let v = 1; v <= 40; v++) {
    const needed = 4 + charCountBits(v) + byteLen * 8;
    if (needed <= DATA_CODEWORDS_L[v - 1] * 8) return v;
  }
  throw new Error('QR: data too long');
}

function buildCodewords(bytes, version) {
  const totalData = DATA_CODEWORDS_L[version - 1];
  const bb = new BitBuffer();
  bb.put(0b0100, 4);                              // byte mode
  bb.put(bytes.length, charCountBits(version));
  for (const b of bytes) bb.put(b, 8);

  const capacity = totalData * 8;
  bb.put(0, Math.min(4, capacity - bb.length));   // terminator
  while (bb.length % 8 !== 0) bb.put(0, 1);

  const data = Array.from(bb.toBytes());
  const pad = [0xec, 0x11];
  let p = 0;
  while (data.length < totalData) data.push(pad[p++ % 2]);

  // Split into blocks, RS-encode each, then interleave data-then-EC.
  const [g1, g2] = BLOCKS_L[version - 1];
  const totalBlocks = g1 + g2;
  const ecLen = EC_PER_BLOCK_L[version - 1];
  const shortLen = Math.floor(totalData / totalBlocks);

  const dataBlocks = [];
  const ecBlocks = [];
  let offset = 0;
  for (let i = 0; i < totalBlocks; i++) {
    const len = i < g1 ? shortLen : shortLen + 1;
    const block = data.slice(offset, offset + len);
    offset += len;
    dataBlocks.push(block);
    ecBlocks.push(rsEncode(block, ecLen));
  }

  const out = [];
  const maxData = Math.max(...dataBlocks.map(b => b.length));
  for (let i = 0; i < maxData; i++) {
    for (const block of dataBlocks) if (i < block.length) out.push(block[i]);
  }
  for (let i = 0; i < ecLen; i++) {
    for (const block of ecBlocks) out.push(block[i]);
  }
  return out;
}

// ── Function patterns ───────────────────────────────────────────────────────
function drawFunctionPatterns(modules, version) {
  const size = modules.length;

  const finder = (r, c) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
        const inRing = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6 &&
          (dr === 0 || dr === 6 || dc === 0 || dc === 6 ||
            (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
        modules[rr][cc] = inRing;
      }
    }
  };
  finder(0, 0);
  finder(0, size - 7);
  finder(size - 7, 0);

  // Timing patterns. Cols/rows 0–7 and size-8… are already covered by the
  // finders and their separators.
  for (let i = 8; i < size - 8; i++) {
    modules[6][i] = i % 2 === 0;
    modules[i][6] = i % 2 === 0;
  }

  // Alignment patterns — every centre pair except the three occupied by finders.
  // Excluded by index, not by "is this cell already set": the patterns centred on
  // the timing row/column legitimately overlap it (and agree with it).
  const pos = ALIGNMENT_POS[version - 1];
  const last = pos.length - 1;
  for (let i = 0; i <= last; i++) {
    for (let j = 0; j <= last; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue;
      const r = pos[i], c = pos[j];
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          modules[r + dr][c + dc] = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
        }
      }
    }
  }

  // Always-dark module, plus the format/version areas reserved so data skips them.
  modules[size - 8][8] = true;
  const reserve = (r, c) => { if (modules[r][c] === null) modules[r][c] = false; };
  for (let i = 0; i < 9; i++) { reserve(8, i); reserve(i, 8); }
  for (let i = 0; i < 8; i++) { reserve(8, size - 1 - i); reserve(size - 1 - i, 8); }
  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        reserve(size - 11 + j, i);   // bottom-left block
        reserve(i, size - 11 + j);   // top-right block
      }
    }
  }
}

/**
 * Zig-zag data placement: two-module-wide columns walked right to left,
 * alternating upward and downward. Column 6 is the vertical timing pattern, so
 * the pair that would start there shifts one left — which also shifts every
 * remaining pair, hence reassigning `right` rather than adjusting one column.
 */
function placeData(modules, isFunction, codewords) {
  const size = modules.length;
  const totalBits = codewords.length * 8;
  let i = 0;
  const bitAt = (n) => n < totalBits ? (codewords[n >> 3] >> (7 - (n & 7))) & 1 : 0;

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        const upward = ((right + 1) & 2) === 0;
        const r = upward ? size - 1 - vert : vert;
        if (isFunction[r][c]) continue;
        modules[r][c] = bitAt(i++) === 1;
      }
    }
  }
}

const MASK_FNS = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => (r * c) % 2 + (r * c) % 3 === 0,
  (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
  (r, c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0,
];

/** XOR the mask over data modules. Applying twice restores the original. */
function applyMask(modules, isFunction, mask) {
  const fn = MASK_FNS[mask];
  const size = modules.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isFunction[r][c] && fn(r, c)) modules[r][c] = !modules[r][c];
    }
  }
}

/**
 * Format information: 5 data bits (EC level + mask) expanded by BCH(15,5) and
 * XORed with 0x5412, written into both copies.
 */
function drawFormatInfo(modules, mask) {
  const size = modules.length;
  const data = (EC_L_BITS << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;
  const bit = (i) => ((bits >>> i) & 1) === 1;

  // First copy: up column 8 beside the top-left finder, then along row 8.
  for (let i = 0; i <= 5; i++) modules[i][8] = bit(i);
  modules[7][8] = bit(6);
  modules[8][8] = bit(7);
  modules[8][7] = bit(8);
  for (let i = 9; i < 15; i++) modules[8][14 - i] = bit(i);

  // Second copy: along row 8 from the bottom-right, then up column 8.
  for (let i = 0; i < 8; i++) modules[8][size - 1 - i] = bit(i);
  for (let i = 8; i < 15; i++) modules[size - 15 + i][8] = bit(i);

  modules[size - 8][8] = true;
}

/** Version information (versions 7+): 6 data bits + BCH(18,6), two copies. */
function drawVersionInfo(modules, version) {
  const size = modules.length;
  let rem = version;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  const bits = (version << 12) | rem;
  for (let i = 0; i < 18; i++) {
    const bit = ((bits >>> i) & 1) === 1;
    const a = size - 11 + (i % 3);
    const b = Math.floor(i / 3);
    modules[b][a] = bit;   // top-right block
    modules[a][b] = bit;   // bottom-left block
  }
}

// ── Mask selection ──────────────────────────────────────────────────────────
const FINDER_RUN_A = [true, false, true, true, true, false, true, false, false, false, false];
const FINDER_RUN_B = [false, false, false, false, true, false, true, true, true, false, true];

function matchesAt(line, pattern, start) {
  for (let k = 0; k < pattern.length; k++) if (line[start + k] !== pattern[k]) return false;
  return true;
}

/** Standard penalty score — lower is easier for a scanner to read. */
function penaltyScore(modules) {
  const size = modules.length;
  let score = 0;

  for (let axis = 0; axis < 2; axis++) {
    for (let i = 0; i < size; i++) {
      const line = [];
      for (let j = 0; j < size; j++) line.push(axis === 0 ? modules[i][j] : modules[j][i]);

      // Rule 1: runs of five or more same-coloured modules.
      let run = 1;
      for (let j = 1; j <= size; j++) {
        if (j < size && line[j] === line[j - 1]) { run++; continue; }
        if (run >= 5) score += 3 + (run - 5);
        run = 1;
      }

      // Rule 3: finder-like 1:1:3:1:1 sequences with four light modules beside them.
      for (let j = 0; j + 11 <= size; j++) {
        if (matchesAt(line, FINDER_RUN_A, j) || matchesAt(line, FINDER_RUN_B, j)) score += 40;
      }
    }
  }

  // Rule 2: 2×2 blocks of one colour.
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = modules[r][c];
      if (v === modules[r][c + 1] && v === modules[r + 1][c] && v === modules[r + 1][c + 1]) score += 3;
    }
  }

  // Rule 4: how far the dark-module proportion strays from 50%.
  let dark = 0;
  for (const row of modules) for (const v of row) if (v) dark++;
  const total = size * size;
  const deviation = Math.floor(Math.abs(dark * 20 - total * 10) / total);
  score += deviation * 10;

  return score;
}

function buildMatrix(codewords, version) {
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => new Array(size).fill(null));

  drawFunctionPatterns(modules, version);
  const isFunction = modules.map(row => row.map(v => v !== null));
  placeData(modules, isFunction, codewords);
  if (version >= 7) drawVersionInfo(modules, version);

  let best = 0;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    applyMask(modules, isFunction, mask);
    drawFormatInfo(modules, mask);
    const score = penaltyScore(modules);
    if (score < bestScore) { bestScore = score; best = mask; }
    applyMask(modules, isFunction, mask);   // undo
  }
  applyMask(modules, isFunction, best);
  drawFormatInfo(modules, best);

  return modules;
}

/**
 * Encode `text` as a QR code and return an SVG string.
 * `size` is the rendered pixel size of the square. Throws when the text is too
 * long for any version, so callers can fall back to showing the link.
 */
export function qrSvg(text, size = 280) {
  const bytes = new TextEncoder().encode(text);
  const version = pickVersion(bytes.length);
  const codewords = buildCodewords(bytes, version);
  const modules = buildMatrix(codewords, version);

  const count = modules.length;
  const quiet = 4;
  const total = count + quiet * 2;

  let path = '';
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (modules[r][c]) path += `M${c + quiet} ${r + quiet}h1v1h-1z`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" role="img" aria-label="QR code linking to this character sheet">
  <rect width="${total}" height="${total}" fill="#ffffff"/>
  <path d="${path}" fill="#000000"/>
</svg>`;
}

/** Module count for `text`, for deciding whether a QR is worth showing. */
export function qrModuleCount(text) {
  return pickVersion(new TextEncoder().encode(text).length) * 4 + 17;
}
