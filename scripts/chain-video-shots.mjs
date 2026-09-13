import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const option = (name) => process.argv.find((argument) => argument.startsWith(`${name}=`))?.slice(name.length + 1);
const manifestPath = path.resolve(root, option('--manifest') || 'prompts/seedance-video-v27-continuous.json');
const spec = JSON.parse(await readFile(manifestPath, 'utf8'));
const sourceDir = path.resolve(root, spec.sourceDir);
const workDir = path.resolve(root, spec.workDir);
const runtimeManifest = path.join(workDir, 'runtime-manifest.json');
const planOnly = process.argv.includes('--plan');

const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd: root, stdio: 'inherit' });
  child.on('error', reject);
  child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)));
});

const exists = async (filename) => {
  try { return (await stat(filename)).size > 1000; } catch { return false; }
};

if (planOnly) {
  console.log(`Opening frame: ${spec.openingFrame}`);
  for (const [index, shot] of spec.shots.entries()) {
    const targetExists = shot.targetFrame ? await exists(path.resolve(root, shot.targetFrame)) : true;
    const targetLabel = shot.targetFrame || 'actual generated final frame';
    console.log(`${index + 1}. ${shot.id} -> ${targetLabel} [${targetExists ? 'ready' : 'missing'}]`);
  }
  console.log('Plan only: no uploads, tasks or generation charges were created.');
  process.exit(0);
}

await mkdir(sourceDir, { recursive: true });
await mkdir(workDir, { recursive: true });
let previousEnd = path.resolve(root, spec.openingFrame);

for (const [index, shot] of spec.shots.entries()) {
  const startExtension = path.extname(previousEnd) || '.jpg';
  const startName = `${String(index + 1).padStart(2, '0')}-start${startExtension}`;
  const endName = `${String(index + 1).padStart(2, '0')}-end.jpg`;
  const startPath = path.join(sourceDir, startName);
  const endPath = path.join(sourceDir, endName);
  await copyFile(previousEnd, startPath);

  let targetName;
  if (shot.targetFrame) {
    const targetSource = path.resolve(root, shot.targetFrame);
    const targetExtension = path.extname(targetSource) || '.png';
    targetName = `${String(index + 1).padStart(2, '0')}-target${targetExtension}`;
    await copyFile(targetSource, path.join(sourceDir, targetName));
  }

  const referenceFrames = [];
  for (const [referenceIndex, referenceFrame] of (shot.referenceFrames || []).entries()) {
    const referenceSource = path.resolve(root, referenceFrame);
    const referenceExtension = path.extname(referenceSource) || '.png';
    const referenceName = `${String(index + 1).padStart(2, '0')}-reference-${String(referenceIndex + 1).padStart(2, '0')}${referenceExtension}`;
    await copyFile(referenceSource, path.join(sourceDir, referenceName));
    referenceFrames.push(referenceName);
  }

  const runtimeSpec = {
    ...spec,
    sourceDir: path.relative(root, sourceDir),
    workDir: path.relative(root, workDir),
    shots: [{
      ...shot,
      start: startName,
      ...(targetName ? { end: targetName } : {}),
      ...(referenceFrames.length ? { referenceFrames } : {}),
    }],
  };
  await writeFile(runtimeManifest, `${JSON.stringify(runtimeSpec, null, 2)}\n`);
  await run(process.execPath, ['scripts/seedance-generate.mjs', `--manifest=${runtimeManifest}`, `--shot=${shot.id}`]);

  const video = path.join(workDir, 'output', `${shot.id}.mp4`);
  if (!(await exists(video))) throw new Error(`Missing generated clip: ${video}`);
  const boundaryDir = path.join(workDir, 'boundaries', shot.id);
  await mkdir(boundaryDir, { recursive: true });
  await run('swift', ['scripts/extract-video-boundaries.swift', path.dirname(video), boundaryDir]);
  const extracted = path.join(boundaryDir, `${shot.id}-end.jpg`);
  if (!(await exists(extracted))) throw new Error(`Missing final frame for ${shot.id}`);
  await copyFile(extracted, endPath);
  previousEnd = endPath;
}

console.log('Continuous chain complete. Every shot used the previous generated final frame as its start frame.');
