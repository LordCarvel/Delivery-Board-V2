import { spawn } from 'node:child_process';
import { constants } from 'node:fs';
import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const docsDir = path.join(rootDir, 'docs');
const distDir = path.join(rootDir, 'dist');
const viteCli = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
const assetToken = '__DELIVERY_HUB_ASSETS__/';

async function pathExists(targetPath) {
  try {
    await access(targetPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function buildWithVite() {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [viteCli, 'build'], {
      cwd: rootDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        DELIVERY_HUB: '1',
      },
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Vite build failed with exit code ${code ?? 'unknown'}.`));
    });
  });
}

async function normalizeStaticHtml(targetPath) {
  const html = await readFile(targetPath, 'utf8');
  const normalized = html
    .replaceAll('/Delivery-Board-V2/assets/', assetToken)
    .replaceAll('/assets/', assetToken)
    .replaceAll(assetToken, './assets/');
  await writeFile(targetPath, normalized, 'utf8');
}

async function buildFromPrebuiltDocs() {
  const docsIndex = path.join(docsDir, 'index.html');
  if (!(await pathExists(docsIndex))) {
    throw new Error('Neither Vite nor docs/index.html is available for the frontend build.');
  }

  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });
  await cp(docsDir, distDir, { recursive: true });

  const indexPath = path.join(distDir, 'index.html');
  await normalizeStaticHtml(indexPath);
  await cp(indexPath, path.join(distDir, '404.html'), { force: true });

  console.log('Using prebuilt frontend snapshot from docs/.');
}

async function normalizeViteOutput() {
  const indexPath = path.join(distDir, 'index.html');
  if (await pathExists(indexPath)) {
    await normalizeStaticHtml(indexPath);
    await cp(indexPath, path.join(distDir, '404.html'), { force: true });
  }
}

if (await pathExists(viteCli)) {
  console.log('Vite detected. Trying source build for Delivery Hub.');
  try {
    await buildWithVite();
    await normalizeViteOutput();
  } catch (error) {
    console.warn(`Source build failed: ${error.message}`);
    console.warn('Falling back to the prebuilt frontend snapshot.');
    await buildFromPrebuiltDocs();
  }
} else {
  await buildFromPrebuiltDocs();
}