// npx tsx scripts/migration/AT/test.ts

import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';
import { transformMultiply } from './transformMultiply';
import type { MyFriendsCountry } from '../createLessonJson';

const PROJECT_ROOT = process.cwd();

const SITE = 'myfriends' as const;

const COUNTRY: MyFriendsCountry = 'AT';
const LANGUAGE = 'deu';

const MASTER_INDEX_PATH = path.join(
  PROJECT_ROOT,
  'public',
  'migration-preview',
  SITE,
  'index.json',
);

type ChapterIndexItem = {
  id: number | null;
  filename?: string;
};

type SeriesIndexJson = {
  chapters: ChapterIndexItem[];
};

type MigrationIndex = Record<string, Record<string, string[]>>;

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

async function readMigrationIndex(): Promise<MigrationIndex> {
  const raw = await fs.readFile(MASTER_INDEX_PATH, 'utf8');
  return JSON.parse(raw) as MigrationIndex;
}

async function readSeriesIndex(
  processedDir: string,
): Promise<SeriesIndexJson> {
  const indexPath = path.join(processedDir, 'index.json');

  const raw = await fs.readFile(indexPath, 'utf8');
  const json = JSON.parse(raw) as SeriesIndexJson;

  if (!Array.isArray(json.chapters)) {
    throw new Error(
      `Invalid series index. No chapters array found: ${indexPath}`,
    );
  }

  return json;
}

function getSortOrder(
  seriesIndex: SeriesIndexJson,
  lessonName: string,
): number | undefined {
  const chapter = seriesIndex.chapters.find(
    (item) => item.filename === lessonName,
  );

  if (!chapter) {
    return undefined;
  }

  if (typeof chapter.id !== 'number') {
    throw new Error(`Lesson has no numeric id in index.json: ${lessonName}`);
  }

  return chapter.id;
}

async function migrateTarget(
  country: MyFriendsCountry,
  language: string,
  series: string,
): Promise<string[]> {
  const sourceDir = path.join(
    PROJECT_ROOT,
    'data',
    'raw',
    SITE,
    country,
    language,
    series,
  );

  const processedDir = path.join(
    PROJECT_ROOT,
    'data',
    'processed_json',
    SITE,
    country,
    language,
    series,
  );

  const previewDir = path.join(
    PROJECT_ROOT,
    'public',
    'migration-preview',
    SITE,
    country,
    language,
    series,
  );

  console.log('');
  console.log('='.repeat(70));
  console.log(`Migrating ${country}/${language}/${series}`);
  console.log('='.repeat(70));

  let entries;

  try {
    entries = await fs.readdir(sourceDir, {
      withFileTypes: true,
    });
  } catch {
    console.warn(`Source directory not found: ${sourceDir}`);
    return [];
  }

  const htmlFiles = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        isSeriesHtmlFile(entry.name),
    )
    .map((entry) => entry.name)
    .sort((a, b) =>
      a.localeCompare(b, undefined, {
        numeric: true,
      }),
    );

  if (htmlFiles.length === 0) {
    console.warn(`No HTML files found in ${sourceDir}`);
    return [];
  }

  const seriesIndex = await readSeriesIndex(processedDir);

  console.log(`Found ${htmlFiles.length} files.`);

  await ensureDir(processedDir);
  await ensureDir(previewDir);

  const lessons: string[] = [];

  for (const fileName of htmlFiles) {
    const sourcePath = path.join(sourceDir, fileName);

    const jsonFileName = toJsonFileName(fileName);
    const lessonName = toLessonName(fileName);

    const sortOrder = getSortOrder(
      seriesIndex,
      lessonName,
    );

    if (sortOrder === undefined) {
      console.warn(`Skipping ${country}/${language}/${series}/${fileName}: not listed in index.json`);
      continue;
    }

    const processedPath = path.join(
      processedDir,
      jsonFileName,
    );

    const previewPath = path.join(
      previewDir,
      jsonFileName,
    );

    const html = await fs.readFile(
      sourcePath,
      'utf8',
    );

    const json = transformMultiply(html, {
      site: SITE,
      country,
      language,
      series: series,
      sourceFile: fileName,
      lessonId: lessonName,
      sortOrder,
    });

    const jsonText =
      `${JSON.stringify(json, null, 2)}\n`;

    await fs.writeFile(
      processedPath,
      jsonText,
      'utf8',
    );

    await fs.writeFile(
      previewPath,
      jsonText,
      'utf8',
    );

    lessons.push(lessonName);

    console.log(
      `  ${fileName} -> sortOrder ${sortOrder}`,
    );
  }

  const previewIndexPath = path.join(
    previewDir,
    'index.json',
  );

  await fs.writeFile(
    previewIndexPath,
    `${JSON.stringify(lessons, null, 2)}\n`,
    'utf8',
  );

  console.log(
    `Wrote ${previewIndexPath}`,
  );

  return lessons;
}

async function run(): Promise<void> {
  const migrationIndex = await readMigrationIndex();
  const indexedSeries = migrationIndex[COUNTRY]?.[LANGUAGE];

  if (!Array.isArray(indexedSeries) || indexedSeries.length === 0 ||
      indexedSeries.some((series) => typeof series !== 'string' || series.trim() === '')) {
    throw new Error(`No valid series list found for ${SITE}/${COUNTRY}/${LANGUAGE} in ${MASTER_INDEX_PATH}`);
  }

  const seriesList = [...new Set(indexedSeries)];
  console.log(`Migrating ${SITE}/${COUNTRY}/${LANGUAGE}: ${seriesList.join(', ')}`);

  let firstPreview: { series: string; lesson: string } | undefined;

  for (const series of seriesList) {
    const lessons = await migrateTarget(COUNTRY, LANGUAGE, series);
    if (!firstPreview && lessons[0]) {
      firstPreview = { series, lesson: lessons[0] };
    }
  }

  console.log(`Finished processing ${seriesList.length} indexed series for ${SITE}/${COUNTRY}/${LANGUAGE}.`);

  if (firstPreview) {
    openBrowser(
      `http://localhost:9000/migration-preview/${SITE}/${COUNTRY}/${LANGUAGE}/${firstPreview.series}/${firstPreview.lesson}`,
    );
  }
}
run().catch((error) => {
  console.error(error);
  process.exit(1);
});
