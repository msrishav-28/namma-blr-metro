import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const sourcePath = path.join(rootDir, 'src/utils/index.ts');
const tempDir = await mkdtemp(path.join(os.tmpdir(), 'svg-path-utils-'));
const modulePath = path.join(tempDir, 'index.mjs');

try {
  const source = await ts.sys.readFile(sourcePath);
  assert.ok(source, `Unable to read ${sourcePath}`);

  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
  });

  await writeFile(modulePath, transpiled.outputText);
  const { default: SVGPathUtils } = await import(modulePath);

  assert.equal(
    SVGPathUtils.inversePath('M0 0 L10 0 L10 10'),
    'M10,10 L10,0 L0,0',
  );
  assert.equal(
    SVGPathUtils.inversePath('M0 0 L10 0 L10 10 Z'),
    'M10,10 L10,0 L0,0 Z',
  );
  assert.equal(
    SVGPathUtils.inversePath('M0 0 L10 0 L10 10 z'),
    'M10,10 L10,0 L0,0 z',
  );
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
