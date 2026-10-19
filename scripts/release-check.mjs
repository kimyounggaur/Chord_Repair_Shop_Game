#!/usr/bin/env node
// Explicit final-check runner. The default is read-only planning, never deployment.
import { createHash, randomBytes } from 'node:crypto';
import { createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { release as osRelease } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const allowed = new Set(['--plan', '--run', '--help']);
if (args.length > 1 || args.some(arg => !allowed.has(arg))) {
  console.error('Usage: node scripts/release-check.mjs [--plan | --run | --help]');
  process.exit(2);
}
if (args.includes('--help')) {
  console.log(`Usage: node scripts/release-check.mjs [--plan | --run]
Default/--plan: inspect prerequisites and print the final command plan; no writes.
--run: npm ci, then each required check in order, stopping at first failure.
Writes unique logs and manifests under docs/evidence/release/<UTC>-<random>/.
Run only when other owners have stopped editing this checkout and dependencies.
Uses existing npm credentials only. Does not deploy, push, probe a URL, change
host settings, install browsers, start a persistent helper, or mark S11/S14 PASS.
Browser projects/environment must already be configured by the coordinator.
The npm E2E command may start its configured local Vite server on port 5486.`);
  process.exit(0);
}

const sha = data => createHash('sha256').update(data).digest('hex');
const slash = path => path.split('\\').join('/');
const readJson = path => JSON.parse(readFileSync(join(root, path), 'utf8'));
const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const scriptNames = ['verify:reference', 'test:content', 'typecheck', 'lint',
  'test:unit', 'test:integration', 'test:audio', 'test:e2e', 'test:a11y', 'build'];
const commands = [{ id: 'clean-install', args: ['ci'] },
  ...scriptNames.map(id => ({ id, args: ['run', id] }))];
const npmCandidates = [process.env.npm_execpath,
  join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'),
  resolve(dirname(process.execPath), '../lib/node_modules/npm/bin/npm-cli.js')];
const npmCli = npmCandidates.find(path => path && existsSync(path));
const npmVersionResult = npmCli ? spawnSync(process.execPath, [npmCli, '--version'], {
  cwd: root, encoding: 'utf8', windowsHide: true,
}) : null;

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Refusing to follow symlink: ${relative(root, path)}`);
    return entry.isDirectory() ? walk(path) : entry.isFile() ? [path] : [];
  });
}

function sourceManifest() {
  const files = ['src', 'tests', 'public', 'scripts'].flatMap(dir => walk(join(root, dir)));
  for (const name of ['package.json', 'package-lock.json', 'index.html', 'tsconfig.json',
    'vite.config.ts', 'playwright.config.ts', 'vercel.json', '.gitignore',
    'docs/design.md', 'docs/promptpack.md']) {
    if (existsSync(join(root, name))) files.push(join(root, name));
  }
  const rows = files.sort().map(path => {
    const bytes = readFileSync(path);
    return { path: slash(relative(root, path)), bytes: bytes.length, sha256: sha(bytes) };
  });
  return { sha256: sha(JSON.stringify(rows)), files: rows };
}

function git(args) {
  const result = spawnSync('git', ['--no-optional-locks', ...args], {
    cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 * 1024,
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

const missingScripts = scriptNames.filter(name => typeof pkg.scripts?.[name] !== 'string');
const suiteFiles = Object.fromEntries(['unit', 'integration', 'audio', 'e2e', 'accessibility']
  .map(dir => [dir, walk(join(root, 'tests', dir))
    .filter(path => /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(path))
    .map(path => slash(relative(root, path)))]));
const missingSuites = Object.entries(suiteFiles).filter(([, files]) => files.length === 0).map(([name]) => name);
const plan = {
  mode: args.includes('--run') ? 'run' : 'plan',
  readiness: missingScripts.length || missingSuites.length || !npmCli ? 'BLOCKED' : 'PLAN_ONLY',
  root, node: process.version, npm: npmVersionResult?.status === 0 ? npmVersionResult.stdout.trim() : null,
  operatingSystem: { platform: process.platform, arch: process.arch, release: osRelease() },
  browserEnvironment: { baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:5486',
    browsersPath: process.env.PLAYWRIGHT_BROWSERS_PATH ?? 'Playwright default cache' },
  npmCli: npmCli ?? null, lockfileVersion: lock.lockfileVersion,
  commit: git(['rev-parse', 'HEAD']), gitStatus: git(['status', '--porcelain=v1', '--untracked-files=all']),
  missingScripts, missingSuites, suiteFiles, commands: commands.map(command => `npm ${command.args.join(' ')}`),
  browserConfiguration: 'Read playwright.config.ts. This runner does not add missing browsers or projects.',
  warnings: [
    'File counts are discovery only: they do not prove runner collection, assertions, or coverage.',
    'An existing Vite server can be reused by Playwright; verify its checkout and port 5486 first.',
    'Production-browser, transfer, device, listening, AT, research, deployment and rollback gates remain separate.',
  ],
};
if (!args.includes('--run')) {
  console.log(JSON.stringify(plan, null, 2));
  process.exit(missingScripts.length || !npmCli ? 1 : 0);
}
if (missingScripts.length || missingSuites.length || !npmCli) {
  console.error(JSON.stringify({ status: 'BLOCKED', missingScripts, missingSuites, npmCli: npmCli ?? null }, null, 2));
  process.exit(1);
}

const stamp = `${new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')}-${randomBytes(3).toString('hex')}`;
const output = join(root, 'docs/evidence/release', stamp);
mkdirSync(output, { recursive: true });
const save = (name, value) => writeFileSync(join(output, name), `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
const before = sourceManifest();
save('source-manifest-before.json', before);
save('plan.json', plan);
const results = [];
const stripAnsi = text => text.replace(/\u001b\[[0-9;]*m/g, '');

async function run(command, index) {
  const file = `${String(index + 1).padStart(2, '0')}-${command.id.replaceAll(':', '-')}.log`;
  const stream = createWriteStream(join(output, file), { flags: 'wx' });
  const startedAt = new Date().toISOString();
  let outputText = '';
  console.log(`\n[release-check] npm ${command.args.join(' ')}`);
  const result = await new Promise(resolveResult => {
    const child = spawn(process.execPath, [npmCli, ...command.args], {
      cwd: root, env: { ...process.env, NO_COLOR: '1' }, windowsHide: true, shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let spawnError;
    child.on('error', error => { spawnError = error.message; });
    const capture = bytes => { outputText += bytes.toString(); stream.write(bytes); process.stdout.write(bytes); };
    child.stdout.on('data', capture);
    child.stderr.on('data', capture);
    child.on('close', (exitCode, signal) => resolveResult({ exitCode, signal, spawnError }));
  });
  await new Promise(resolveStream => stream.end(resolveStream));
  const plain = stripAnsi(outputText);
  const isTest = command.id.startsWith('test:');
  const noTests = isTest && /(?:no tests found|no test files found)/i.test(plain);
  const skipped = isTest && /\b[1-9]\d*\s+(?:skipped|todo)\b/i.test(plain);
  return { command: `npm ${command.args.join(' ')}`, startedAt, endedAt: new Date().toISOString(),
    ...result, status: result.exitCode === 0 && !noTests && !skipped ? 'PASS' : 'FAIL',
    noTestsReported: noTests, skippedTestsReported: skipped,
    summaries: plain.split(/\r?\n/).filter(line => /Test Files|\bTests\s|\d+ passed|\d+ failed|\d+ skipped/.test(line)),
    log: slash(relative(root, join(output, file))) };
}

let failure;
let artifact;
try {
  for (const [index, command] of commands.entries()) {
    const result = await run(command, index);
    results.push(result);
    if (result.status !== 'PASS') { failure = `${command.id} failed or reported skipped/empty tests`; break; }
  }
  if (!failure) {
    if (!existsSync(join(root, 'dist/index.html'))) throw new Error('Successful build did not produce dist/index.html');
    const files = walk(join(root, 'dist')).sort().map(path => {
      const bytes = readFileSync(path);
      return { path: slash(relative(join(root, 'dist'), path)), bytes: bytes.length,
        gzipBytes: gzipSync(bytes).length, sha256: sha(bytes) };
    });
    const javascriptGzip = files.filter(file => /\.m?js$/.test(file.path)).reduce((sum, file) => sum + file.gzipBytes, 0);
    const assetBytes = files.filter(file => !/\.(?:html|m?js|css|map)$/.test(file.path)).reduce((sum, file) => sum + file.bytes, 0);
    artifact = { files, manifestSha256: sha(JSON.stringify(files)), javascriptGzip, assetBytes,
      budgets: { javascriptGzip: 250000, allAssets: 5000000 },
      status: javascriptGzip <= 250000 && assetBytes <= 5000000 ? 'PASS' : 'FAIL',
      scope: 'All built JS gzip is a conservative bound for initial JS, not measured network transfer. Assets include non-HTML/JS/CSS/map files. 1.5MB initial transfer, timing and physical latency are NOT measured.' };
    save('artifact-manifest.json', artifact);
    if (artifact.status !== 'PASS') failure = 'Static build budget exceeded';
  }
} catch (error) {
  failure = error.message;
}
const after = sourceManifest();
save('source-manifest-after.json', after);
if (before.sha256 !== after.sha256) failure = [failure, 'Source/config/test files changed during the run'].filter(Boolean).join('; ');
const commitAfter = git(['rev-parse', 'HEAD']);
if (plan.commit !== commitAfter) failure = [failure, 'Git HEAD changed during the run'].filter(Boolean).join('; ');
const summary = {
  createdAt: new Date().toISOString(), status: failure ? 'FAIL' : 'AUTOMATED_CHECKS_PASS', failure: failure ?? null,
  releaseReadiness: 'NOT_ASSESSED', commitBefore: plan.commit, commitAfter,
  sourceStable: before.sha256 === after.sha256, sourceSha256: after.sha256,
  artifactManifestSha256: artifact?.manifestSha256 ?? null,
  commands: commands.map((command, i) => results[i] ?? { command: `npm ${command.args.join(' ')}`, status: 'NOT RUN', reason: 'Earlier check failed' }),
  outstanding: ['Production browser/offline tests and measured initial transfer', 'Firefox/WebKit/viewport/keyboard/AT evidence',
    '20-minute leak and real device/listening/output-latency evidence', 'S12 observation gate and S13 release audit',
    'Committed/pushed exact SHA, provider READY metadata, public URL/content/header checks and rollback limits'],
};
save('summary.json', summary);
console.log(`\n[release-check] ${summary.status}: ${slash(relative(root, output))}/summary.json`);
process.exitCode = failure ? 1 : 0;
