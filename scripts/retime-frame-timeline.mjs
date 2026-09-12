import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const root = path.resolve(process.argv[2] || 'site-public/olive-core-v27');
const manifestPath = path.join(root, 'sequence.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const byId = new Map(manifest.segments.map((segment) => [segment.id, segment]));

const edit = {
  '01-sky-to-soil': { start: 0, end: 86 },
  '02-root-and-shoot': { start: 0, end: 89 },
  '03-through-the-trunk': { start: 1, end: 87 },
  '04-trunk-to-branch': { start: 0, end: 87 },
  '05-branch-to-fruit': { start: 0, end: 90 },
};

const joins = [
  { left: '01-sky-to-soil', right: '02-root-and-shoot', blendFrames: 2 },
  { left: '02-root-and-shoot', right: '03-through-the-trunk', blendFrames: 1 },
  { left: '03-through-the-trunk', right: '04-trunk-to-branch', blendFrames: 1 },
  { left: '04-trunk-to-branch', right: '05-branch-to-fruit', blendFrames: 2 },
];

const frameName = (index) => `${String(index).padStart(4, '0')}.webp`;
const framePath = (segment, index) => `${segment.frames}/${frameName(index)}`;
const joinDir = path.join(root, 'frames', '_joins');
await fs.mkdir(joinDir, { recursive: true });

const blendFrames = async (leftPath, rightPath, mix, destination) => {
  const [{ data: left, info }, { data: right }] = await Promise.all([
    sharp(leftPath).removeAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(rightPath).removeAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  if (left.length !== right.length) throw new Error(`Join dimensions differ: ${leftPath} and ${rightPath}`);
  const output = Buffer.allocUnsafe(left.length);
  for (let index = 0; index < output.length; index += 1) {
    output[index] = Math.round(left[index] * (1 - mix) + right[index] * mix);
  }
  await sharp(output, { raw: info }).webp({ quality: 80, effort: 5, smartSubsample: true }).toFile(destination);
};

for (const join of joins) {
  const left = byId.get(join.left);
  const right = byId.get(join.right);
  if (!left?.frames || !right?.frames) throw new Error(`Missing source segment for ${join.left} -> ${join.right}`);
  const outputDir = path.join(joinDir, `${join.left}--${join.right}`);
  await fs.mkdir(outputDir, { recursive: true });
  const leftSource = path.join(root, framePath(left, edit[join.left].end));
  const rightSource = path.join(root, framePath(right, edit[join.right].start));
  for (let index = 0; index < join.blendFrames; index += 1) {
    const mix = (index + 1) / (join.blendFrames + 1);
    await blendFrames(leftSource, rightSource, mix, path.join(outputDir, frameName(index)));
  }
}

const frames = [];
const playbackSegments = [];
const boundaries = [];

for (const [segmentIndex, source] of manifest.segments.entries()) {
  const trim = edit[source.id];
  if (!trim || !source.frames || source.count <= trim.end) throw new Error(`Invalid retime range for ${source.id}`);
  const globalStart = frames.length;
  for (let index = trim.start; index <= trim.end; index += 1) frames.push(framePath(source, index));
  const globalEnd = frames.length - 1;
  playbackSegments.push({
    ...source,
    sourceStart: trim.start,
    sourceEnd: trim.end,
    globalStart,
    globalEnd,
  });

  const join = joins[segmentIndex];
  if (!join) continue;
  const joinStart = frames.length;
  for (let index = 0; index < join.blendFrames; index += 1) {
    frames.push(`frames/_joins/${join.left}--${join.right}/${frameName(index)}`);
  }
  boundaries.push({
    id: `${join.left}--${join.right}`,
    leftSourceFrame: edit[join.left].end,
    rightSourceFrame: edit[join.right].start,
    blendFrames: join.blendFrames,
    globalJoinStart: joinStart,
    globalJoinEnd: frames.length - 1,
    nextSegmentStart: frames.length,
  });
}

const output = {
  version: 2,
  format: manifest.format || 'webp',
  fps: manifest.fps || 18,
  frameCount: frames.length,
  pacing: {
    mode: 'global-frame',
    desktopPixelsPerFrame: 40,
    mobilePixelsPerFrame: 30,
  },
  frames,
  boundaries,
  segments: playbackSegments,
};

await fs.writeFile(manifestPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${frames.length} retimed global frames to ${manifestPath}`);
