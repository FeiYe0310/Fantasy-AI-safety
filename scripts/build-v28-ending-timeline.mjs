import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const priorRoot = path.resolve(root, 'site-public/olive-core-v27');
const outputRoot = path.resolve(root, 'site-public/olive-core-v28');
const videoRoot = path.resolve(root, 'artwork-source/seedance-video-v28-ending/output');
const frameWorkRoot = path.resolve(root, 'artwork-source/seedance-video-v28-ending/frames-jpg');
const fps = 18;
const width = 1280;

const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd: root, stdio: 'inherit' });
  child.on('error', reject);
  child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)));
});

const exists = async (filename) => {
  try { return (await stat(filename)).size > 100_000; } catch { return false; }
};

const frameName = (index) => `${String(index).padStart(4, '0')}.webp`;
const priorFrame = (segment, index) => `../olive-core-v27/frames/${segment}/${frameName(index)}`;
const newFrame = (segment, index) => `frames/${segment}/${frameName(index)}`;

await readFile(path.join(priorRoot, 'sequence.json'), 'utf8');
await mkdir(path.join(outputRoot, 'frames'), { recursive: true });

const newSegments = ['06-core-ascent', '07-fruit-to-leaf', '08-mend-the-sky'];
const counts = new Map();

for (const segment of newSegments) {
  const video = path.join(videoRoot, `${segment}.mp4`);
  if (!(await exists(video))) throw new Error(`Missing generated clip: ${video}`);
  const jpegDir = path.join(frameWorkRoot, segment);
  const webpDir = path.join(outputRoot, 'frames', segment);
  await run('swift', ['scripts/extract-video-frames.swift', video, jpegDir, String(fps), String(width)]);
  await run(process.execPath, ['scripts/encode-frame-sequence.mjs', jpegDir, webpDir, segment]);
  const encoded = JSON.parse(await readFile(path.join(webpDir, 'manifest.json'), 'utf8'));
  counts.set(segment, encoded.count);
}

const segmentSpecs = [
  { id: '01-sky-to-soil', frames: '../olive-core-v27/frames/01-sky-to-soil', count: 91, start: 0, end: 86 },
  { id: '02-root-and-shoot', frames: '../olive-core-v27/frames/02-root-and-shoot', count: 91, start: 0, end: 89 },
  { id: '06-core-ascent', frames: 'frames/06-core-ascent', count: counts.get('06-core-ascent'), start: 1, end: 89 },
  { id: '07-fruit-to-leaf', frames: 'frames/07-fruit-to-leaf', count: counts.get('07-fruit-to-leaf'), start: 0, end: 90 },
  { id: '08-mend-the-sky', frames: 'frames/08-mend-the-sky', count: counts.get('08-mend-the-sky'), start: 2, end: 90 },
];

const frames = [];
const segments = [];
const boundaries = [];

for (const [index, segment] of segmentSpecs.entries()) {
  const globalStart = frames.length;
  for (let sourceIndex = segment.start; sourceIndex <= segment.end; sourceIndex += 1) {
    frames.push(index < 2 ? priorFrame(segment.id, sourceIndex) : newFrame(segment.id, sourceIndex));
  }
  const globalEnd = frames.length - 1;
  segments.push({
    id: segment.id,
    frames: segment.frames,
    count: segment.count,
    sourceStart: segment.start,
    sourceEnd: segment.end,
    globalStart,
    globalEnd,
  });

  if (index === segmentSpecs.length - 1) continue;
  if (index === 0) {
    const joinStart = frames.length;
    frames.push('../olive-core-v27/frames/_joins/01-sky-to-soil--02-root-and-shoot/0000.webp');
    frames.push('../olive-core-v27/frames/_joins/01-sky-to-soil--02-root-and-shoot/0001.webp');
    boundaries.push({
      id: '01-sky-to-soil--02-root-and-shoot',
      leftSourceFrame: segment.end,
      rightSourceFrame: segmentSpecs[index + 1].start,
      blendFrames: 2,
      globalJoinStart: joinStart,
      globalJoinEnd: frames.length - 1,
      nextSegmentStart: frames.length,
    });
  } else {
    boundaries.push({
      id: `${segment.id}--${segmentSpecs[index + 1].id}`,
      leftSourceFrame: segment.end,
      rightSourceFrame: segmentSpecs[index + 1].start,
      blendFrames: 0,
      globalJoinStart: frames.length,
      globalJoinEnd: frames.length - 1,
      nextSegmentStart: frames.length,
    });
  }
}

const manifest = {
  version: 2,
  format: 'webp',
  fps,
  frameCount: frames.length,
  pacing: {
    mode: 'global-frame',
    desktopPixelsPerFrame: 40,
    mobilePixelsPerFrame: 30,
  },
  frames,
  boundaries,
  segments,
};

await writeFile(path.join(outputRoot, 'sequence.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${frames.length} continuous frames to ${path.join(outputRoot, 'sequence.json')}`);
