import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const [inputArg, outputArg, slug = 'sequence'] = process.argv.slice(2);
if (!inputArg || !outputArg) {
  throw new Error('Usage: node scripts/encode-frame-sequence.mjs INPUT_DIR OUTPUT_DIR [SLUG]');
}

const inputDir = path.resolve(inputArg);
const outputDir = path.resolve(outputArg);
await mkdir(outputDir, { recursive: true });

const files = (await readdir(inputDir))
  .filter((file) => /\.(jpe?g|png)$/i.test(file))
  .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
if (!files.length) throw new Error(`No source frames found in ${inputDir}`);

for (const [index, file] of files.entries()) {
  const destination = path.join(outputDir, `${String(index).padStart(4, '0')}.webp`);
  await sharp(path.join(inputDir, file))
    .resize({ width: 1280, withoutEnlargement: true })
    .webp({ quality: 76, effort: 5, smartSubsample: true })
    .toFile(destination);
}

const manifest = {
  id: slug,
  format: 'webp',
  count: files.length,
  pattern: '%04d.webp',
};
await writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Encoded ${files.length} WebP frames in ${outputDir}`);

