// scripts/migration/multiply1/migrate-multiply1-file-test.ts
//
// Run:
// npx tsx scripts/migration/multiply1/migrate-multiply1-file-test.ts multiply102.html
//
// If no filename is supplied, it defaults to multiply102.html.

import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';
import { transformMultiply } from './transformMultiply';
const PROJECT_ROOT = process.cwd();
const SITE = 'myfriends' as const;
const COUNTRY = 'AU' as const;
const LANGUAGE = 'eng' as const;
const SERIES = 'multiply' as const;

const DEFAULT_FILE = 'multiply102.html';

const sourceFile = process.argv[2] || DEFAULT_FILE;

const SOURCE_DIR = path.join(PROJECT_ROOT, 'data', 'raw', SITE, COUNTRY, LANGUAGE, SERIES);

const PROCESSED_DIR = path.join(PROJECT_ROOT, 'data', 'processed', SITE, COUNTRY, LANGUAGE, SERIES);

const PREVIEW_DIR = path.join(
  PROJECT_ROOT,
  'public',
  'migration-preview',
  SITE,
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

function isHtmlFile(fileName: string): boolean {
  return /\.html$/i.test(fileName);
}

function toJsonFileName(fileName: string): string {
  return fileName.replace(/\.html$/i, '.json');
}

function toLessonName(fileName: string): string {
  return fileName.replace(/\.html$/i, '');
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function run(): Promise<void> {
  if (!isHtmlFile(sourceFile)) {
    throw new Error(`Expected an HTML file name. Received: ${sourceFile}`);
  }

  const sourcePath = path.join(SOURCE_DIR, sourceFile);

  if (!(await fileExists(sourcePath))) {
    throw new Error(`Source file not found: ${sourcePath}`);
  }

  await ensureDir(PROCESSED_DIR);
  await ensureDir(PREVIEW_DIR);

  const jsonFileName = toJsonFileName(sourceFile);
  const lessonName = toLessonName(sourceFile);

  const processedPath = path.join(PROCESSED_DIR, jsonFileName);
  const previewPath = path.join(PREVIEW_DIR, jsonFileName);
  const indexPath = path.join(PREVIEW_DIR, 'index.json');

  console.log(`Migrating one file: ${sourceFile}`);
  console.log(`Source: ${sourcePath}`);

  const html = await fs.readFile(sourcePath, 'utf8');

  const lessonId = sourceFile.replace(/\.html$/i, '');
  const sortOrder = 0;

  const json = transformMultiply(html, {
    site: SITE,
    country: COUNTRY,
    language: LANGUAGE,
    series: SERIES,
    lessonId,
    sourceFile,
    sortOrder,
  });

  const jsonText = JSON.stringify(json, null, 2);

  await fs.writeFile(processedPath, jsonText, 'utf8');
  await fs.writeFile(previewPath, jsonText, 'utf8');

  await fs.writeFile(indexPath, JSON.stringify([lessonName], null, 2), 'utf8');

  console.log(`Migrated ${sourceFile}`);
  console.log(`  processed: ${processedPath}`);
  console.log(`  preview:   ${previewPath}`);
  console.log(`  index:     ${indexPath}`);

  openBrowser(
    `http://localhost:9000/migration-preview/${SITE}/${COUNTRY}/${LANGUAGE}/${SERIES}/${lessonName}`,
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
