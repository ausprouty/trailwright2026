import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';
import { migrateOldLessonHtmlToEditorJs } from './migrateOldLessonHtml';

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

async function ensureDir(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

function openBrowser(url: string): void {
  const command =
    process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`;

  exec(command);
}

async function run(): Promise<void> {
  const html = await fs.readFile(SOURCE_HTML, 'utf8');

  const json = migrateOldLessonHtmlToEditorJs(html, {
    includeTime: true,
    includeVersion: true,
  });
  // 👇 ADD THIS
  console.log('\nBLOCK TYPES:\n');
  console.log(json.blocks.map((b) => b.type));
  console.log('\n');

  const jsonText = JSON.stringify(json, null, 2);

  await ensureDir(PROCESSED_JSON);
  await fs.writeFile(PROCESSED_JSON, jsonText, 'utf8');

  await ensureDir(PREVIEW_JSON);
  await fs.writeFile(PREVIEW_JSON, jsonText, 'utf8');

  console.log(`Saved processed JSON:
${PROCESSED_JSON}`);

  console.log(`Saved preview JSON:
${PREVIEW_JSON}`);

  openBrowser('http://localhost:9000/migration-preview');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
