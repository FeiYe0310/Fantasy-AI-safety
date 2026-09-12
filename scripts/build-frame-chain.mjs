import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const option = (name) => process.argv.find((argument) => argument.startsWith(`${name}=`))?.slice(name.length + 1);
const manifestPath = path.resolve(root, option('--manifest') || 'prompts/seedance-video-v27-continuous.json');
const spec = JSON.parse(await readFile(manifestPath, 'utf8'));
const workDir = path.resolve(root, spec.workDir);
const outputRoot = path.resolve(root, option('--output') || 'site-public/olive-core-v27');
const fps = Number(option('--fps') || 18);
const width = Number(option('--width') || 1280);

const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd: root, stdio: 'inherit' });
  child.on('error', reject);
  child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)));
});
const exists = async (filename) => {
  try { return (await stat(filename)).size > 100_000; } catch { return false; }
};

await mkdir(outputRoot, { recursive: true });
const segments = [];
for (const shot of spec.shots) {
  const video = path.join(workDir, 'output', `${shot.id}.mp4`);
  if (!(await exists(video))) {
    segments.push({ id: shot.id, count: 0 });
    continue;
  }

  const jpegDir = path.join(workDir, 'frames-jpg', shot.id);
  const webpDir = path.join(outputRoot, 'frames', shot.id);
  await run('swift', ['scripts/extract-video-frames.swift', video, jpegDir, String(fps), String(width)]);
  await run(process.execPath, ['scripts/encode-frame-sequence.mjs', jpegDir, webpDir, shot.id]);
  const frameManifest = JSON.parse(await readFile(path.join(webpDir, 'manifest.json'), 'utf8'));
  segments.push({ id: shot.id, frames: `frames/${shot.id}`, count: frameManifest.count });
}

const manifest = { version: 1, format: 'webp', fps, segments };
await writeFile(path.join(outputRoot, 'sequence.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${path.join(outputRoot, 'sequence.json')}`);

