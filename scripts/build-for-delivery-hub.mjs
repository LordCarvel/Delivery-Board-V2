import { spawn } from 'node:child_process';
import { constants } from 'node:fs';
import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const docsDir = path.join(rootDir, 'docs');
const distDir = path.join(rootDir, 'dist');
const viteCli = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');

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

async function buildFromPrebuiltDocs() {
  const docsIndex = path.join(docsDir, 'index.html');
  if (!(await pathExists(docsIndex))) {
    throw new Error('Neither Vite nor docs/index.html is available for the frontend build.');
  }

  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });
  await cp(docsDir, distDir, { recursive: true });

  const indexPath = path.join(distDir, 'index.html');
  const indexHtml = await readFile(indexPath, 'utf8');
  const deliveryHubHtml = indexHtml.replaceAll('/Delivery-Board-V2/assets/', '/assets/');
  await writeFile(indexPath, deliveryHubHtml, 'utf8');

  const fallback404 = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Delivery Board</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script>
      window.location.replace('/' + window.location.search + (window.location.hash || ''));
    </script>
  </head>
  <body>
    <p>Redirecionando...</p>
  </body>
</html>
`;
  await writeFile(path.join(distDir, '404.html'), fallback404, 'utf8');

  console.log('Using prebuilt frontend snapshot from docs/.');
}

if (await pathExists(viteCli)) {
  console.log('Vite detected. Trying source build for Delivery Hub.');
  try {
    await buildWithVite();
  } catch (error) {
    console.warn(`Source build failed: ${error.message}`);
    console.warn('Falling back to the prebuilt frontend snapshot.');
    await buildFromPrebuiltDocs();
  }
} else {
  await buildFromPrebuiltDocs();
}