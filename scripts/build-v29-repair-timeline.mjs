import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const root = process.cwd();
const priorRoot = path.resolve(root, 'site-public/olive-core-v28');
const outputRoot = path.resolve(root, 'site-public/olive-core-v29');
const frameRoot = path.join(outputRoot, 'frames/08-repair-expanded');
const keyframeRoot = path.resolve(root, 'artwork-source/v29-repair-keyframes');
const clipRoot = path.resolve(root, 'artwork-source/seedance-video-v28-ending/frames-jpg');
const width = 1280;
const height = 720;
const fps = 18;

const smooth = (value) => {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
};

const lerp = (from, to, amount) => from + (to - from) * amount;
const frameName = (index) => `${String(index).padStart(4, '0')}.webp`;

const cropMotion = async (input, { zoom = 1, focusX = .5, focusY = .5 } = {}) => {
  const image = sharp(input);
  const metadata = await image.metadata();
  const sourceWidth = metadata.width;
  const sourceHeight = metadata.height;
  const sourceAspect = sourceWidth / sourceHeight;
  const targetAspect = width / height;
  let baseWidth = sourceWidth;
  let baseHeight = sourceHeight;
  if (sourceAspect > targetAspect) baseWidth = Math.round(sourceHeight * targetAspect);
  else baseHeight = Math.round(sourceWidth / targetAspect);
  const cropWidth = Math.max(2, Math.round(baseWidth / zoom));
  const cropHeight = Math.max(2, Math.round(baseHeight / zoom));
  const left = Math.round(Math.min(sourceWidth - cropWidth, Math.max(0, focusX * sourceWidth - cropWidth / 2)));
  const top = Math.round(Math.min(sourceHeight - cropHeight, Math.max(0, focusY * sourceHeight - cropHeight / 2)));
  return image.extract({ left, top, width: cropWidth, height: cropHeight }).resize(width, height).png().toBuffer();
};

const blend = async (under, over, opacity) => {
  if (opacity <= 0) return under;
  if (opacity >= 1) return over;
  const overlay = await sharp(over).ensureAlpha(opacity).png().toBuffer();
  return sharp(under).composite([{ input: overlay, blend: 'over' }]).png().toBuffer();
};

const encode = async (buffer, index) => {
  await sharp(buffer).webp({ quality: 82, effort: 4 }).toFile(path.join(frameRoot, frameName(index)));
};

const priorManifest = JSON.parse(await readFile(path.join(priorRoot, 'sequence.json'), 'utf8'));
const repair = priorManifest.segments.find((segment) => segment.id === '08-mend-the-sky');
if (!repair) throw new Error('The v28 repair segment was not found.');

await mkdir(frameRoot, { recursive: true });

const priorLeaf = path.join(clipRoot, '07-fruit-to-leaf/0090.jpg');
const nuwaWide = path.join(keyframeRoot, '01-nuwa-full-body-open-fracture.png');
const healedSky = path.join(keyframeRoot, '02-healed-sky-kintsugi.png');
const contactFrame = path.join(clipRoot, '08-mend-the-sky/0030.jpg');
const activeRepairFrame = path.join(clipRoot, '08-mend-the-sky/0055.jpg');

let outputIndex = 0;

// Pull back from the plucked leaf until Nüwa's complete figure and the still-open fracture are readable.
for (let index = 0; index < 20; index += 1) {
  const t = smooth(index / 19);
  const wide = await cropMotion(nuwaWide, {
    zoom: lerp(2.15, 1, t),
    focusX: lerp(.61, .56, t),
    focusY: lerp(.26, .5, t),
  });
  const prior = await cropMotion(priorLeaf, { zoom: lerp(1.03, 1.08, t), focusX: .57, focusY: .5 });
  await encode(await blend(prior, wide, smooth(index / 7)), outputIndex++);
}

// A short living wide shot establishes Nüwa without freezing the camera.
for (let index = 0; index < 4; index += 1) {
  const t = index / 3;
  await encode(await cropMotion(nuwaWide, {
    zoom: lerp(1, 1.025, t),
    focusX: lerp(.56, .565, t),
    focusY: lerp(.5, .49, t),
  }), outputIndex++);
}

// Push back toward the leaf so the existing close repair action remains the visual anchor.
let lastWideClose;
for (let index = 0; index < 14; index += 1) {
  const t = smooth(index / 13);
  lastWideClose = await cropMotion(nuwaWide, {
    zoom: lerp(1.025, 2.15, t),
    focusX: lerp(.565, .61, t),
    focusY: lerp(.49, .26, t),
  });
  await encode(lastWideClose, outputIndex++);
}

const contact = await cropMotion(contactFrame, { zoom: 1 });
for (let index = 0; index < 4; index += 1) {
  const t = smooth((index + 1) / 4);
  await encode(await blend(lastWideClose, contact, t), outputIndex++);
}

// Preserve the real motion in which gold enters and maps the original dark fracture.
for (let sourceIndex = 31; sourceIndex <= 55; sourceIndex += 1) {
  const input = path.join(clipRoot, `08-mend-the-sky/${String(sourceIndex).padStart(4, '0')}.jpg`);
  await encode(await cropMotion(input, { zoom: 1 }), outputIndex++);
}

// Make the state change explicit: active branching repair closes into a restrained audit scar.
const activeRepair = await cropMotion(activeRepairFrame, { zoom: 1 });
for (let index = 0; index < 18; index += 1) {
  const t = smooth((index + 1) / 18);
  const healed = await cropMotion(healedSky, {
    zoom: lerp(1.025, 1.01, t),
    focusX: lerp(.51, .5, t),
    focusY: lerp(.49, .5, t),
  });
  await encode(await blend(activeRepair, healed, t), outputIndex++);
}

// Keep a subtle camera breath in the final healed sky; never duplicate a frozen final frame.
for (let index = 0; index < 8; index += 1) {
  const t = smooth(index / 7);
  await encode(await cropMotion(healedSky, {
    zoom: lerp(1.01, 1, t),
    focusX: lerp(.505, .5, t),
    focusY: .5,
  }), outputIndex++);
}

const carryFrame = (frame) => frame.startsWith('../') ? frame : `../olive-core-v28/${frame}`;
const frames = priorManifest.frames.slice(0, repair.globalStart).map(carryFrame);
const repairGlobalStart = frames.length;
for (let index = 0; index < outputIndex; index += 1) {
  frames.push(`frames/08-repair-expanded/${frameName(index)}`);
}

const segments = priorManifest.segments
  .filter((segment) => segment.id !== repair.id)
  .map((segment) => ({ ...segment, frames: segment.frames.startsWith('../') ? segment.frames : `../olive-core-v28/${segment.frames}` }));
segments.push({
  id: '08-repair-expanded',
  frames: 'frames/08-repair-expanded',
  count: outputIndex,
  sourceStart: 0,
  sourceEnd: outputIndex - 1,
  globalStart: repairGlobalStart,
  globalEnd: frames.length - 1,
});

const boundaries = priorManifest.boundaries.map((boundary) => (
  boundary.id === '07-fruit-to-leaf--08-mend-the-sky'
    ? { ...boundary, id: '07-fruit-to-leaf--08-repair-expanded', rightSourceFrame: 0, nextSegmentStart: repairGlobalStart }
    : boundary
));

const manifest = {
  ...priorManifest,
  frameCount: frames.length,
  frames,
  segments,
  boundaries,
  fps,
};

await writeFile(path.join(outputRoot, 'sequence.json'), `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(path.join(frameRoot, 'manifest.json'), `${JSON.stringify({
  segment: '08-repair-expanded',
  count: outputIndex,
  fps,
  width,
  height,
  sources: ['07-fruit-to-leaf/0090.jpg', '01-nuwa-full-body-open-fracture.png', '08-mend-the-sky/0030-0055.jpg', '02-healed-sky-kintsugi.png'],
}, null, 2)}\n`);

console.log(`Wrote ${frames.length} global frames with ${outputIndex} expanded repair frames.`);
