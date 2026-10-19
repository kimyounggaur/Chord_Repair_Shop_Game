// Isolated tests of the runner itself. These are NOT application or release checks.
import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const runner = join(dirname(fileURLToPath(import.meta.url)), 'release-check.mjs');
const temporary = mkdtempSync(join(tmpdir(), 'chord-release-selftest-'));
const scripts = Object.fromEntries(['verify:reference', 'test:content', 'typecheck', 'lint',
  'test:unit', 'test:integration', 'test:audio', 'test:e2e', 'test:a11y', 'build'].map(name => [name, 'fixture-only']));
const fakeNpm = `import {mkdirSync,writeFileSync} from 'node:fs';
const mode=process.env.CHORD_RELEASE_SELFTEST_SCENARIO;
const command=process.argv.slice(2).join(' ');
if(mode==='failure' && command==='run test:unit'){console.error('Synthetic child failure');process.exit(9);}
if(mode==='skip' && command==='run test:unit'){console.log('Tests 1 skipped (1)');process.exit(0);}
if(command==='run build'){
 mkdirSync('dist',{recursive:true});writeFileSync('dist/index.html','<html>fixture</html>');
 writeFileSync('dist/app.js','console.log("fixture");');
 if(mode==='mutation')writeFileSync('src/main.ts','// changed during check');
}
console.log(command.includes('test:')?'Tests 1 passed (1)':'Synthetic '+command+' completed');
`;

function fixture(name, omitAudio = false) {
  const root = join(temporary, name);
  for (const dir of ['scripts', 'src', 'tests/unit', 'tests/integration', 'tests/audio', 'tests/e2e', 'tests/accessibility']) {
    mkdirSync(join(root, dir), { recursive: true });
  }
  copyFileSync(runner, join(root, 'scripts/release-check.mjs'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ type: 'module', scripts }));
  writeFileSync(join(root, 'package-lock.json'), JSON.stringify({ lockfileVersion: 3 }));
  writeFileSync(join(root, 'src/main.ts'), '// synthetic test fixture');
  for (const suite of ['unit', 'integration', 'audio', 'e2e', 'accessibility']) {
    if (omitAudio && suite === 'audio') continue;
    writeFileSync(join(root, 'tests', suite, 'fixture.test.ts'), '// discovery fixture only');
  }
  writeFileSync(join(root, 'fake-npm.mjs'), fakeNpm);
  return root;
}

function invoke(root, mode, flag = '--run') {
  return spawnSync(process.execPath, [join(root, 'scripts/release-check.mjs'), flag], {
    cwd: root, encoding: 'utf8', windowsHide: true,
    env: { ...process.env, npm_execpath: join(root, 'fake-npm.mjs'), CHORD_RELEASE_SELFTEST_SCENARIO: mode },
    maxBuffer: 2 * 1024 * 1024,
  });
}

function summary(root) {
  const base = join(root, 'docs/evidence/release');
  const dirs = readdirSync(base);
  assert.equal(dirs.length, 1);
  return JSON.parse(readFileSync(join(base, dirs[0], 'summary.json'), 'utf8'));
}

try {
  const planRoot = fixture('plan');
  const plan = invoke(planRoot, 'success', '--plan');
  assert.equal(plan.status, 0, plan.stderr);
  assert.equal(existsSync(join(planRoot, 'docs')), false, 'Plan must not create evidence');
  assert.equal(JSON.parse(plan.stdout).commands.length, 11);

  const missingRoot = fixture('missing-audio', true);
  const missing = invoke(missingRoot, 'success');
  assert.equal(missing.status, 1);
  assert.deepEqual(JSON.parse(missing.stderr).missingSuites, ['audio']);
  assert.equal(existsSync(join(missingRoot, 'docs')), false, 'Preflight must stop before npm/evidence writes');

  for (const scenario of ['success', 'failure', 'skip', 'mutation']) {
    const root = fixture(scenario);
    const result = invoke(root, scenario);
    assert.equal(result.status, scenario === 'success' ? 0 : 1, result.stderr);
    const report = summary(root);
    assert.equal(report.releaseReadiness, 'NOT_ASSESSED');
    if (scenario === 'success') {
      assert.equal(report.status, 'AUTOMATED_CHECKS_PASS');
      assert.equal(report.commands.length, 11);
      assert.equal(report.commands.every(command => command.status === 'PASS'), true);
      assert.match(report.artifactManifestSha256, /^[0-9a-f]{64}$/);
      assert.equal(report.sourceStable, true);
    } else if (scenario === 'mutation') {
      assert.equal(report.status, 'FAIL');
      assert.equal(report.sourceStable, false);
      assert.match(report.failure, /changed during the run/);
    } else {
      assert.equal(report.status, 'FAIL');
      const unit = report.commands.find(command => command.command === 'npm run test:unit');
      assert.equal(unit.status, 'FAIL');
      assert.equal(unit.exitCode, scenario === 'failure' ? 9 : 0);
      assert.equal(unit.skippedTestsReported, scenario === 'skip');
      assert.equal(report.commands.find(command => command.command === 'npm run build').status, 'NOT RUN');
      assert.equal(report.artifactManifestSha256, null);
    }
  }
  console.log('PASS: 6 isolated runner scenarios (plan, empty suite, success, failure, skip, source mutation).');
  console.log('Synthetic command fixtures only; no game tests, dependency install, browser, network or deployment ran.');
} finally {
  const resolved = resolve(temporary);
  const allowedParent = `${resolve(tmpdir())}${sep}`;
  assert.ok(resolved.startsWith(allowedParent) && resolved.includes(`${sep}chord-release-selftest-`));
  rmSync(resolved, { recursive: true, force: true });
}
