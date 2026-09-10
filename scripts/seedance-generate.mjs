import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const envPath = path.join(root, '.env.local');
const optionValue = (name) => process.argv.find((argument) => argument.startsWith(`${name}=`))?.slice(name.length + 1);
const manifestPath = path.resolve(root, optionValue('--manifest') || path.join('prompts', 'seedance-video-v1.json'));

const parseEnv = (text) => Object.fromEntries(text.split(/\r?\n/).filter(Boolean).filter((line) => !line.startsWith('#')).map((line) => {
  const split = line.indexOf('=');
  return [line.slice(0, split), line.slice(split + 1)];
}));

const env = { ...parseEnv(await readFile(envPath, 'utf8')), ...process.env };
const apiBase = env.HAOMAO_API_BASE;
const apiKey = env.HAOMAO_API_KEY;
if (!apiBase || !apiKey) throw new Error('Missing HAOMAO_API_BASE or HAOMAO_API_KEY in .env.local');

const spec = JSON.parse(await readFile(manifestPath, 'utf8'));
const sourceDir = path.resolve(root, spec.sourceDir || path.join('artwork-source', 'olive-story-v5-classical-glaze'));
const workDir = path.resolve(root, spec.workDir || path.join('artwork-source', 'seedance-video-v1'));
const outputDir = path.join(workDir, 'output');
const cachePath = path.join(workDir, 'cache.json');
const selected = process.argv.includes('--all')
  ? spec.shots
  : spec.shots.filter((shot) => process.argv.includes(`--shot=${shot.id}`));
if (!selected.length) throw new Error('Select --all or one or more --shot=<id> values.');

const estimatedRates = {
  'seedance-2.0-mini': 0.21,
  'seedance-2.0-fast': 0.46,
  'seedance-2.5': 1.36,
};
const estimatedCost = selected.reduce((sum, shot) => sum + estimatedRates[shot.model] * spec.defaults.duration, 0);
if (estimatedCost > 50) throw new Error(`Estimated cost ${estimatedCost.toFixed(2)} exceeds the 50 CNY hard limit.`);

await mkdir(outputDir, { recursive: true });
let cache = {};
try { cache = JSON.parse(await readFile(cachePath, 'utf8')); } catch { cache = { files: {}, tasks: {} }; }
cache.files ||= {};
cache.tasks ||= {};

const auth = { Authorization: `Bearer ${apiKey}` };
const request = async (url, init = {}) => {
  const response = await fetch(url, init);
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!response.ok || body?.success === false) throw new Error(`${init.method || 'GET'} ${url}: HTTP ${response.status} ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  return body;
};

const unwrap = (body) => body?.data ?? body;
const persist = () => writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`);

async function uploadImage(filename) {
  if (cache.files[filename]?.url) return cache.files[filename];
  const filePath = path.join(sourceDir, filename);
  const buffer = await readFile(filePath);
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'image/png' }), filename);
  const uploaded = unwrap(await request(`${apiBase}/api/v3/files/uploads`, { method: 'POST', headers: auth, body: form }));
  const id = uploaded.id ?? uploaded.file_id;
  if (!id) throw new Error(`Upload response did not include a file id: ${JSON.stringify(uploaded)}`);
  const fileInfo = unwrap(await request(`${apiBase}/api/v3/files/${id}`, { headers: auth }));
  const url = fileInfo.url ?? fileInfo.download_url;
  if (!url) throw new Error(`File response did not include a URL: ${JSON.stringify(fileInfo)}`);
  cache.files[filename] = { id, url };
  await persist();
  return cache.files[filename];
}

function findVideoUrl(value) {
  if (typeof value === 'string' && /^https?:\/\//.test(value) && /\.(mp4|webm)(?:\?|$)/i.test(value)) return value;
  if (!value || typeof value !== 'object') return null;
  for (const child of Object.values(value)) {
    const found = findVideoUrl(child);
    if (found) return found;
  }
  return null;
}

async function createTask(shot, references) {
  const payload = {
    model: shot.model,
    content: [
      { type: 'text', text: `${spec.defaults.styleLock} ${shot.prompt}` },
      ...references.map(({ url }) => ({ type: 'image_url', image_url: { url }, role: 'reference_image' })),
    ],
    duration: spec.defaults.duration,
    ratio: spec.defaults.ratio,
    resolution: spec.defaults.resolution,
    generate_audio: spec.defaults.generate_audio,
    watermark: spec.defaults.watermark,
  };
  const created = unwrap(await request(`${apiBase}/api/v3/contents/generations/tasks`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }));
  const id = created.id ?? created.task_id;
  if (!id) throw new Error(`Create response did not include a task id: ${JSON.stringify(created)}`);
  cache.tasks[shot.id] = { id, model: shot.model, status: created.status ?? 'queued', createdAt: new Date().toISOString() };
  await persist();
  return id;
}

async function waitForTask(shot, taskId) {
  const deadline = Date.now() + 30 * 60 * 1000;
  while (Date.now() < deadline) {
    const task = unwrap(await request(`${apiBase}/api/v3/contents/generations/tasks/${taskId}`, { headers: auth }));
    const status = task.status ?? task.state;
    cache.tasks[shot.id] = { ...cache.tasks[shot.id], status, updatedAt: new Date().toISOString() };
    await persist();
    console.log(`${shot.id}: ${status}`);
    if (['succeeded', 'success', 'completed'].includes(status)) return task;
    if (['failed', 'error', 'cancelled', 'canceled'].includes(status)) throw new Error(`${shot.id} failed: ${JSON.stringify(task.error ?? task)}`);
    await new Promise((resolve) => setTimeout(resolve, 7000));
  }
  throw new Error(`${shot.id} timed out after 30 minutes.`);
}

for (const shot of selected) {
  const destination = path.join(outputDir, `${shot.id}.mp4`);
  try {
    if ((await stat(destination)).size > 100_000) {
      console.log(`${shot.id}: already downloaded, skipping`);
      continue;
    }
  } catch {}

  console.log(`${shot.id}: uploading references`);
  const references = await Promise.all([uploadImage(shot.start), uploadImage(shot.end)]);
  let taskId = cache.tasks[shot.id]?.id;
  let result;
  if (taskId && !['failed', 'error', 'cancelled', 'canceled'].includes(cache.tasks[shot.id]?.status)) {
    console.log(`${shot.id}: resuming task ${taskId}`);
  } else {
    console.log(`${shot.id}: creating ${shot.model} task`);
    taskId = await createTask(shot, references);
  }
  result = await waitForTask(shot, taskId);
  const videoUrl = findVideoUrl(result);
  if (!videoUrl) throw new Error(`${shot.id}: completed response did not include a video URL: ${JSON.stringify(result)}`);
  const videoResponse = await fetch(videoUrl);
  if (!videoResponse.ok) throw new Error(`${shot.id}: download failed: HTTP ${videoResponse.status}`);
  await writeFile(destination, Buffer.from(await videoResponse.arrayBuffer()));
  cache.tasks[shot.id] = { ...cache.tasks[shot.id], status: 'downloaded', videoUrl, destination, downloadedAt: new Date().toISOString() };
  await persist();
  console.log(`${shot.id}: saved ${destination}`);
}

console.log(`Finished ${selected.length} shot(s). Estimated generation cost: CNY ${estimatedCost.toFixed(2)}.`);
