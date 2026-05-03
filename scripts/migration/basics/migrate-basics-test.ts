// npx tsx scripts/migration/basics/migrate-basics-test.ts

import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';
import { transformBasics } from './transformBasics';

const PROJECT_ROOT = process.cwd();

const COUNTRY = 'AT';
const LANGUAGE = 'deu';
const SERIES = 'basics';

const SOURCE_DIR = path.join(PROJECT_ROOT, 'data', 'raw', 'myfriends', COUNTRY, LANGUAGE, SERIES);

const PROCESSED_DIR = path.join(
  PROJECT_ROOT,
  'data',
  'processed',
  'myfriends',
  COUNTRY,
  LANGUAGE,
  SERIES,
);

const PREVIEW_DIR = path.join(
  PROJECT_ROOT,
  'public',
  'migration-preview',
  'myfriends',
  COUNTRY,
  LANGUAGE,
  SERIES,
);

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
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

function isSeriesHtmlFile(fileName: string): boolean {
  return /\.html$/i.test(fileName);
}

function toJsonFileName(fileName: string): string {
  return fileName.replace(/\.html$/i, '.json');
}

function toLessonName(fileName: string): string {
  return fileName.replace(/\.html$/i, '');
}

async function run(): Promise<void> {
  const entries = await fs.readdir(SOURCE_DIR, { withFileTypes: true });

  const htmlFiles = entries
    .filter((entry) => entry.isFile() && isSeriesHtmlFile(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (htmlFiles.length === 0) {
    throw new Error(`No matching HTML files found in ${SOURCE_DIR}`);
  }

  console.log(`Found ${htmlFiles.length} files to migrate.`);

  await ensureDir(PROCESSED_DIR);
  await ensureDir(PREVIEW_DIR);

  const lessons: string[] = [];

  for (const fileName of htmlFiles) {
    const sourcePath = path.join(SOURCE_DIR, fileName);
    const jsonFileName = toJsonFileName(fileName);
    const lessonName = toLessonName(fileName);

    const processedPath = path.join(PROCESSED_DIR, jsonFileName);
    const previewPath = path.join(PREVIEW_DIR, jsonFileName);

    const html = await fs.readFile(sourcePath, 'utf8');

    const json = transformBasics(html, {
      country: COUNTRY,
      language: LANGUAGE,
      series: SERIES,
      sourceFile: fileName,
    });

    const jsonText = JSON.stringify(json, null, 2);

    await fs.writeFile(processedPath, jsonText, 'utf8');
    await fs.writeFile(previewPath, jsonText, 'utf8');

    lessons.push(lessonName);

    console.log(`Migrated ${fileName}`);
    console.log(`  processed: ${processedPath}`);
    console.log(`  preview:   ${previewPath}`);
  }

  const indexPath = path.join(PREVIEW_DIR, 'index.json');
  const indexText = JSON.stringify(lessons, null, 2);

  await fs.writeFile(indexPath, indexText, 'utf8');

  console.log(`Wrote preview index: ${indexPath}`);

  const firstLesson = lessons[0];
  if (!firstLesson) {
    throw new Error('Unexpected: no first lesson after migration');
  }

  openBrowser(
    `http://localhost:9000/migration-preview/${COUNTRY}/${LANGUAGE}/${SERIES}/${firstLesson}`,
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
