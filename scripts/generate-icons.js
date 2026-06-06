// Dependency-free icon generator for Hexbench.
// Draws a gold hexagon mark and writes app icons (PNG + ICO), tray icons, and an SVG.
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

const ASSETS = path.join(__dirname, "../assets");

// Brand colors
const GOLD = [212, 175, 55];
const DARK = [12, 12, 16];

// ── PNG encoding ────────────────────────────────────────────────────────────
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}
function crc32(buf, s = 0, e = buf.length) {
  let c = 0xffffffff;
  for (let i = s; i < e; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out, 4, 8 + data.length), 8 + data.length);
  return out;
}
function encodePng(size, rgba) {
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0;
    rgba.copy(row, 1, y * size * 4, (y + 1) * size * 4);
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Hexagon raster ──────────────────────────────────────────────────────────
function hexVertices(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 90); // pointy-top
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
}
function inPolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// `transparentCenter` keeps the dark fill (app icon); when false the whole hex is gold (tray).
function hexIcon(size, { fill = true } = {}) {
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const outer = hexVertices(cx, cy, size * 0.46);
  const inner = hexVertices(cx, cy, size * 0.36);
  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      if (inPolygon(x, y, inner) && fill) {
        rgba[i] = DARK[0]; rgba[i + 1] = DARK[1]; rgba[i + 2] = DARK[2]; rgba[i + 3] = 255;
      } else if (inPolygon(x, y, outer)) {
        rgba[i] = GOLD[0]; rgba[i + 1] = GOLD[1]; rgba[i + 2] = GOLD[2]; rgba[i + 3] = 255;
      }
    }
  }
  return encodePng(size, rgba);
}

// ── ICO encoding (wraps PNG buffers; Windows Vista+) ─────────────────────────
function encodeIco(pngs) {
  const count = pngs.length;
  const header = Buffer.alloc(6 + count * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);
  let offset = 6 + count * 16;
  pngs.forEach((p, idx) => {
    const e = 6 + idx * 16;
    header[e] = p.size >= 256 ? 0 : p.size;
    header[e + 1] = p.size >= 256 ? 0 : p.size;
    header.writeUInt16LE(1, e + 4);  // planes
    header.writeUInt16LE(32, e + 6); // bit count
    header.writeUInt32LE(p.buf.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += p.buf.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.buf)]);
}

// ── SVG ──────────────────────────────────────────────────────────────────────
const SVG = `<svg width="256" height="256" viewBox="0 0 20 23" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 1L19 6V17L10 22L1 17V6L10 1Z" fill="#0c0c10" stroke="#d4af37" stroke-width="1.5" stroke-linejoin="round"/>
  <text x="10" y="15" text-anchor="middle" font-size="7" font-weight="700" fill="#d4af37" font-family="sans-serif">HB</text>
</svg>
`;

function write(name, buf) {
  fs.writeFileSync(path.join(ASSETS, name), buf);
  console.log("wrote", name);
}

function generate() {
  // App icon — PNG sizes
  write("icon.png", hexIcon(256));
  write("icon_126.png", hexIcon(126));

  // App icon — ICO with multiple resolutions
  write("icon.ico", encodeIco([16, 32, 48, 64, 128, 256].map((s) => ({ size: s, buf: hexIcon(s) }))));

  // Tray icons (solid gold hexagon reads better at small sizes)
  write("icon-tray-16.png", hexIcon(16, { fill: false }));
  write("icon-tray-32.png", hexIcon(32, { fill: false }));
  write("icon-tray-64.png", hexIcon(64, { fill: false }));
  write("icon-tray.ico", encodeIco([16, 32, 64].map((s) => ({ size: s, buf: hexIcon(s, { fill: false }) }))));
  write("tray-icon.png", hexIcon(32, { fill: false }));

  // Vector source
  write("icon.svg", Buffer.from(SVG, "utf8"));

  console.log("Icons generated.");
}

generate();
