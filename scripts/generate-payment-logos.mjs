/**
 * Оптимизированные логотипы платёжных систем → public/photos/pay/*.webp
 * Run: node scripts/generate-payment-logos.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public/photos/pay');

/** maxHeight — целевая высота @2x для компактного футера (~h-8). */
const LOGOS = [
  { id: 'bepaid', src: 'public/images/payment/bepaid.png', maxHeight: 128 },
  { id: 'erip', src: 'public/photos/pay/ерип.svg', maxHeight: 86, svgDensity: 320 },
  { id: 'visa', src: 'public/images/payment/visa.png', maxHeight: 120, trim: true },
  { id: 'mastercard', src: 'public/images/payment/mastercard.svg', maxHeight: 128, svgDensity: 320 },
  { id: 'belkart', src: 'public/images/payment/belkart.png', maxHeight: 128 },
];

async function exportLogo({ id, src, maxHeight, trim = false, svgDensity = 72 }) {
  const sourcePath = path.join(ROOT, src);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing source: ${src}`);
  }

  const isSvg = sourcePath.toLowerCase().endsWith('.svg');
  let pipeline = sharp(sourcePath, isSvg ? { density: svgDensity } : undefined);

  if (trim) {
    pipeline = pipeline.trim({ threshold: 12 });
  }

  pipeline = pipeline.resize({
    height: maxHeight,
    fit: 'inside',
    withoutEnlargement: true,
    kernel: sharp.kernel.lanczos3,
  });

  const outPath = path.join(OUT_DIR, `${id}.webp`);
  await pipeline.webp({ quality: 86, alphaQuality: 90, effort: 4 }).toFile(outPath);

  const meta = await sharp(outPath).metadata();
  const bytes = fs.statSync(outPath).size;
  return { id, outPath, width: meta.width, height: meta.height, bytes };
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const results = [];
for (const logo of LOGOS) {
  results.push(await exportLogo(logo));
}

for (const row of results) {
  console.log(
    `${row.id}.webp  ${row.width}×${row.height}  ${(row.bytes / 1024).toFixed(1)} KiB`,
  );
}

console.log(`\nWrote ${results.length} files to public/photos/pay/`);
