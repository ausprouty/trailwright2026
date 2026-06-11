// npx tsx scripts/migration/basics/migrate-basics-test.ts

import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';
import { transformBasics } from './transformBasics';

const PROJECT_ROOT = process.cwd();

const SITE = 'myfriends' as const;
const COUNTRY = 'EG' as const;
const LANGUAGE = 'arb';
const SERIES = 'basics';

const SOURCE_DIR = path.join(PROJECT_ROOT, 'data', 'raw', SITE, COUNTRY, LANGUAGE, SERIES);

const PROCESSED_DIR = path.join(
  PROJECT_ROOT,
  'data',
  'processed_json',
  SITE,
  COUNTRY,
  LANGUAGE,
  SERIES,
);

const PREVIEW_DIR = path.join(
  PROJECT_ROOT,
  'public',
  'migration-preview',
  SITE,
  COUNTRY,
  LANGUAGE,
  SERIES,
);

type ChapterIndexItem = {
  id: number | null;
  filename?: string;
};

type SeriesIndexJson = {
  chapters: ChapterIndexItem[];
};

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

async function readSeriesIndex(): Promise<SeriesIndexJson> {
  const indexPath = path.join(PROCESSED_DIR, 'index.json');

  const raw = await fs.readFile(indexPath, 'utf8');
  const json = JSON.parse(raw) as SeriesIndexJson;

  if (!Array.isArray(json.chapters)) {
    throw new Error(`Invalid series index. No chapters array found: ${indexPath}`);
  }

  return json;
}

function getSortOrder(seriesIndex: SeriesIndexJson, lessonName: string): number {
  const chapter = seriesIndex.chapters.find((item) => item.filename === lessonName);

  if (!chapter) {
    throw new Error(`Could not find lesson in index.json: ${lessonName}`);
  }

  if (typeof chapter.id !== 'number') {
    throw new Error(`Lesson has no numeric id in index.json: ${lessonName}`);
  }

  return chapter.id;
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

  const seriesIndex = await readSeriesIndex();

  console.log(`Found ${htmlFiles.length} files to migrate.`);
  console.log(`Using sort order from: ${path.join(PROCESSED_DIR, 'index.json')}`);

  await ensureDir(PROCESSED_DIR);
  await ensureDir(PREVIEW_DIR);

  const lessons: string[] = [];

  for (const fileName of htmlFiles) {
    const sourcePath = path.join(SOURCE_DIR, fileName);
    const jsonFileName = toJsonFileName(fileName);
    const lessonName = toLessonName(fileName);
    const sortOrder = getSortOrder(seriesIndex, lessonName);

    const processedPath = path.join(PROCESSED_DIR, jsonFileName);
    const previewPath = path.join(PREVIEW_DIR, jsonFileName);

    const html = await fs.readFile(sourcePath, 'utf8');

    const json = transformBasics(html, {
      site: SITE,
      country: COUNTRY,
      language: LANGUAGE,
      series: SERIES,
      sourceFile: fileName,
      lessonId: lessonName,
      sortOrder,
    });

    const jsonText = `${JSON.stringify(json, null, 2)}\n`;

    await fs.writeFile(processedPath, jsonText, 'utf8');
    await fs.writeFile(previewPath, jsonText, 'utf8');

    lessons.push(lessonName);

    console.log(`Migrated ${fileName}`);
    console.log(`  sortOrder: ${sortOrder}`);
    console.log(`  processed: ${processedPath}`);
    console.log(`  preview:   ${previewPath}`);
  }

  const previewIndexPath = path.join(PREVIEW_DIR, 'index.json');
  const previewIndexText = `${JSON.stringify(lessons, null, 2)}\n`;

  await fs.writeFile(previewIndexPath, previewIndexText, 'utf8');

  console.log(`Wrote preview index: ${previewIndexPath}`);

  const firstLesson = lessons[0];

  if (!firstLesson) {
    throw new Error('Unexpected: no first lesson after migration');
  }

  openBrowser(
    `http://localhost:9000/migration-preview/${SITE}/${COUNTRY}/${LANGUAGE}/${SERIES}/${firstLesson}`,
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
