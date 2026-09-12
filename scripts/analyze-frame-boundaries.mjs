import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(process.argv[2] || 'site-public/olive-core-v27');
const sheetsFlag = process.argv.indexOf('--sheets');
const sheetsDir = sheetsFlag >= 0
  ? path.resolve(process.argv[sheetsFlag + 1] || '/tmp/olive-boundary-sheets')
  : null;
const manifest = JSON.parse(await fs.readFile(path.join(root, 'sequence.json'), 'utf8'));
const sampleWidth = 160;
const sampleHeight = 90;

const loadFrame = async (relativePath) => {
  const { data, info } = await sharp(path.join(root, relativePath))
    .resize(sampleWidth, sampleHeight, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let sum = 0;
  for (const value of data) sum += value;
  return { data, luma: sum / data.length, width: info.width, height: info.height };
};

const mae = (a, b) => {
  let total = 0;
  for (let index = 0; index < a.length; index += 1) total += Math.abs(a[index] - b[index]);
  return total / a.length;
};

const framePath = (segment, index) => `${segment.frames}/${String(index).padStart(4, '0')}.webp`;
const cache = new Map();
const getRelativeFrame = async (relativePath) => {
  if (!cache.has(relativePath)) cache.set(relativePath, loadFrame(relativePath));
  return cache.get(relativePath);
};
const getFrame = async (segment, index) => {
  const key = framePath(segment, index);
  return getRelativeFrame(key);
};

const motionAt = async (segment, index) => {
  if (index <= 0) return null;
  const [before, after] = await Promise.all([getFrame(segment, index - 1), getFrame(segment, index)]);
  return mae(before.data, after.data);
};

const round = (value) => value == null ? null : Number(value.toFixed(3));
const boundaries = [];

const globalMotionWindow = async (boundary) => {
  if (!Array.isArray(manifest.frames) || !manifest.frames.length) return [];
  const center = boundary.nextSegmentStart;
  const start = Math.max(1, center - 5);
  const end = Math.min(manifest.frames.length - 1, center + 5);
  const window = [];
  for (let index = start; index <= end; index += 1) {
    const [before, after] = await Promise.all([
      getRelativeFrame(manifest.frames[index - 1]),
      getRelativeFrame(manifest.frames[index]),
    ]);
    window.push({ index, motion: round(mae(before.data, after.data)) });
  }
  return window;
};

const makeContactSheet = async (left, right, boundaryIndex) => {
  if (!sheetsDir) return null;
  await fs.mkdir(sheetsDir, { recursive: true });
  const columns = 8;
  const tileWidth = 240;
  const tileHeight = 154;
  const frames = [
    ...Array.from({ length: 15 }, (_, offset) => ({ segment: left, index: left.count - 15 + offset, side: 'A' })),
    ...Array.from({ length: 15 }, (_, index) => ({ segment: right, index, side: 'B' })),
  ];
  const rows = Math.ceil(frames.length / columns);
  const composites = await Promise.all(frames.map(async ({ segment, index, side }, tileIndex) => {
    const imagePath = path.join(root, framePath(segment, index));
    const image = await sharp(imagePath).resize(tileWidth, tileHeight, { fit: 'cover' }).jpeg({ quality: 82 }).toBuffer();
    const label = Buffer.from(`<svg width="${tileWidth}" height="${tileHeight}"><rect width="86" height="25" fill="rgba(0,0,0,.72)"/><text x="8" y="18" fill="white" font-size="15" font-family="monospace">${side}${String(index).padStart(2, '0')}</text></svg>`);
    return {
      input: await sharp(image).composite([{ input: label }]).png().toBuffer(),
      left: (tileIndex % columns) * tileWidth,
      top: Math.floor(tileIndex / columns) * tileHeight,
    };
  }));
  const output = path.join(sheetsDir, `${String(boundaryIndex + 1).padStart(2, '0')}-${left.id}-to-${right.id}.jpg`);
  await sharp({ create: { width: columns * tileWidth, height: rows * tileHeight, channels: 3, background: '#111' } })
    .composite(composites)
    .jpeg({ quality: 88 })
    .toFile(output);
  return output;
};

for (let boundary = 0; boundary < manifest.segments.length - 1; boundary += 1) {
  const left = manifest.segments[boundary];
  const right = manifest.segments[boundary + 1];
  const leftStart = Math.max(1, left.count - 15);
  const leftMotion = [];
  const rightMotion = [];
  for (let index = leftStart; index < left.count; index += 1) {
    leftMotion.push({ index, motion: round(await motionAt(left, index)) });
  }
  for (let index = 1; index < Math.min(15, right.count); index += 1) {
    rightMotion.push({ index, motion: round(await motionAt(right, index)) });
  }

  const leftLast = await getFrame(left, left.count - 1);
  const rightFirst = await getFrame(right, 0);
  const candidates = [];
  for (let leftTrim = 0; leftTrim <= 8; leftTrim += 1) {
    for (let rightTrim = 0; rightTrim <= 8; rightTrim += 1) {
      const leftIndex = left.count - 1 - leftTrim;
      const rightIndex = rightTrim;
      const [leftFrame, rightFrame] = await Promise.all([getFrame(left, leftIndex), getFrame(right, rightIndex)]);
      const spatial = mae(leftFrame.data, rightFrame.data);
      const leftSpeed = await motionAt(left, leftIndex);
      const rightSpeed = rightIndex > 0
        ? await motionAt(right, rightIndex)
        : await motionAt(right, 1);
      const velocityGap = Math.abs((leftSpeed || 0) - (rightSpeed || 0));
      candidates.push({
        leftIndex,
        rightIndex,
        spatial: round(spatial),
        leftSpeed: round(leftSpeed),
        rightSpeed: round(rightSpeed),
        velocityGap: round(velocityGap),
        score: round(spatial + velocityGap * 2.5),
      });
    }
  }
  candidates.sort((a, b) => a.score - b.score);

  boundaries.push({
    id: `${left.id} -> ${right.id}`,
    exactJoinMae: round(mae(leftLast.data, rightFirst.data)),
    lumaJump: round(rightFirst.luma - leftLast.luma),
    leftMotion,
    rightMotion,
    bestTrimCandidates: candidates.slice(0, 12),
    retimedGlobalMotion: manifest.boundaries?.[boundary]
      ? await globalMotionWindow(manifest.boundaries[boundary])
      : [],
    contactSheet: await makeContactSheet(left, right, boundary),
  });
}

console.log(JSON.stringify({ root, fps: manifest.fps, boundaries }, null, 2));
