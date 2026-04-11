import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';

const PROJECT_ROOT = process.cwd();

const SOURCE_HTML = path.join(
  PROJECT_ROOT,
  'data',
  'raw',
  'myfriends',
  'AU',
  'eng',
  'life',
  'life202.html',
);

const PROCESSED_JSON = path.join(
  PROJECT_ROOT,
  'data',
  'processed',
  'myfriends',
  'AU',
  'eng',
  'life',
  'life202.json',
);

const PREVIEW_JSON = path.join(PROJECT_ROOT, 'public', 'migration-preview', 'life202.json');

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

/*
 * Replace the body of this function with your real migration logic.
 * For now it creates a minimal EditorJS-style document so that the
 * pipeline and preview page are working.
 */
function migrateLegacyHtmlToJson(html) {
  const cleanedHtml = html.trim();

  return {
    time: Date.now(),
    version: '2.31.5',
    blocks: [
      {
        id: 'legacy-html-preview',
        type: 'raw',
        data: {
          html: cleanedHtml,
        },
      },
    ],
  };
}

function openBrowser(url) {
  const command =
    process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`;

  exec(command);
}

async function run() {
  const html = await fs.readFile(SOURCE_HTML, 'utf8');
  const json = migrateLegacyHtmlToJson(html);
  const jsonText = JSON.stringify(json, null, 2);

  await ensureDir(PROCESSED_JSON);
  await fs.writeFile(PROCESSED_JSON, jsonText, 'utf8');

  await ensureDir(PREVIEW_JSON);
  await fs.writeFile(PREVIEW_JSON, jsonText, 'utf8');

  console.log(`Saved processed JSON:
${PROCESSED_JSON}`);

  console.log(`Saved preview JSON:
${PREVIEW_JSON}`);

  /*
   * Adjust this URL if your router uses hash mode.
   * For Quasar/Vite history mode:
   *   http://localhost:9000/migration-preview
   *
   * For hash mode:
   *   http://localhost:9000/#/migration-preview
   */
  openBrowser('http://localhost:9000/migration-preview');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
