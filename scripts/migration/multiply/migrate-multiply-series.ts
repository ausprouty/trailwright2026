// npx tsx scripts/migration/multiply/migrate-multiply-series.ts multiply1
// npx tsx scripts/migration/multiply/migrate-multiply-series.ts multiply2
// npx tsx scripts/migration/multiply/migrate-multiply-series.ts multiply3

import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';
import { transformMyfriends } from './transformMyfriends';
import type { MyFriendsCountry } from '../createLessonJson';

const PROJECT_ROOT = process.cwd();

const SITE = 'myfriends' as const;

// Usage:
// npx tsx scripts/migration/multiply/migrate-multiply-series.ts multiply1
const SERIES = process.argv[2] || 'multiply1';

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

type MigrationTarget = {
  country: MyFriendsCountry;
  language: string;
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

async function readMigrationIndex(): Promise<MigrationIndex> {
  const raw = await fs.readFile(MASTER_INDEX_PATH, 'utf8');
  return JSON.parse(raw) as MigrationIndex;
}

function findSeriesTargets(migrationIndex: MigrationIndex, series: string): MigrationTarget[] {
  const targets: MigrationTarget[] = [];

  for (const [country, languages] of Object.entries(migrationIndex)) {
    for (const [language, seriesList] of Object.entries(languages)) {
      if (!seriesList.includes(series)) {
        continue;
      }

      targets.push({
        country: country as MyFriendsCountry,
        language,
      });
    }
  }

  return targets;
}

async function readSeriesIndex(processedDir: string): Promise<SeriesIndexJson> {
  const indexPath = path.join(processedDir, 'index.json');

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

async function migrateTarget(country: MyFriendsCountry, language: string): Promise<string[]> {
  const sourceDir = path.join(PROJECT_ROOT, 'data', 'raw', SITE, country, language, SERIES);

  const processedDir = path.join(
    PROJECT_ROOT,
    'data',
    'processed_json',
    SITE,
    country,
    language,
    SERIES,
  );

  const previewDir = path.join(
    PROJECT_ROOT,
    'public',
    'migration-preview',
    SITE,
    country,
    language,
    SERIES,
  );

  console.log('');
  console.log('='.repeat(70));
  console.log(`Migrating ${country}/${language}/${SERIES}`);
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
    .filter((entry) => entry.isFile() && isSeriesHtmlFile(entry.name))
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

    const sortOrder = getSortOrder(seriesIndex, lessonName);

    const processedPath = path.join(processedDir, jsonFileName);

    const previewPath = path.join(previewDir, jsonFileName);

    const html = await fs.readFile(sourcePath, 'utf8');

    const json = transformMyfriends(html, {
      site: SITE,
      country,
      language,
      series: SERIES,
      sourceFile: fileName,
      lessonId: lessonName,
      sortOrder,
    });

    const jsonText = `${JSON.stringify(json, null, 2)}\n`;

    await fs.writeFile(processedPath, jsonText, 'utf8');

    await fs.writeFile(previewPath, jsonText, 'utf8');

    lessons.push(lessonName);

    console.log(`  ${fileName} -> sortOrder ${sortOrder}`);
  }

  const previewIndexPath = path.join(previewDir, 'index.json');

  await fs.writeFile(previewIndexPath, `${JSON.stringify(lessons, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${previewIndexPath}`);

  return lessons;
}

async function run(): Promise<void> {
  const migrationIndex = await readMigrationIndex();

  const targets = findSeriesTargets(migrationIndex, SERIES);

  if (targets.length === 0) {
    throw new Error(`Series "${SERIES}" was not found in ${MASTER_INDEX_PATH}`);
  }

  console.log(`Series "${SERIES}" found in ${targets.length} country/language combinations:`);

  for (const target of targets) {
    console.log(`  ${target.country}/${target.language}`);
  }

  let firstPreview:
    | {
        country: string;
        language: string;
        lesson: string;
      }
    | undefined;

  for (const target of targets) {
    const lessons = await migrateTarget(target.country, target.language);

    if (!firstPreview && lessons[0]) {
      firstPreview = {
        country: target.country,
        language: target.language,
        lesson: lessons[0],
      };
    }
  }

  console.log('');
  console.log(`Finished migrating ${SERIES}.`);

  if (firstPreview) {
    openBrowser(
      `http://localhost:9000/migration-preview/${SITE}/${firstPreview.country}/${firstPreview.language}/${SERIES}/${firstPreview.lesson}`,
    );
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
