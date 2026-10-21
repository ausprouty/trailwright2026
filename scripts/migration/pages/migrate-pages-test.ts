// npx tsx scripts/migration/pages/migrate-pages-test.ts

import fs from 'node:fs/promises';
import path from 'node:path';
import { transformMyfriends } from './transformMyfriends';
import type { TransformContext } from './transformMyfriends';

const PROJECT_ROOT = process.cwd();
const RAW_ROOT = path.join(PROJECT_ROOT, 'data', 'raw');
const PROCESSED_ROOT = path.join(PROJECT_ROOT, 'data', 'processed_json');
const PREVIEW_ROOT = path.join(PROJECT_ROOT, 'public', 'migration-preview');
const SERIES = 'pages' as const;

type PageDirectory = {
  site: string;
  country: string;
  language: string;
  sourceDir: string;
  processedDir: string;
  previewDir: string;
};

function isHtmlFile(fileName: string): boolean {
  return /\.html$/i.test(fileName) && fileName.toLowerCase() !== 'index.html';
}

function toLessonName(fileName: string): string {
  return fileName.replace(/\.html$/i, '');
}

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

/** Find data/raw/{site}/{country}/{language}/pages, recursively. */
async function findPageDirectories(directory: string): Promise<PageDirectory[]> {
  const results: PageDirectory[] = [];
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const fullPath = path.join(directory, entry.name);

    if (entry.name.toLowerCase() === SERIES) {
      const parts = path.relative(RAW_ROOT, fullPath).split(path.sep);

      if (parts.length !== 4) {
        console.warn(`Skipping unexpected pages directory: ${fullPath}`);
        continue;
      }

      const [site, country, language] = parts;
      if (!site || !country || !language) continue;

      results.push({
        site,
        country,
        language,
        sourceDir: fullPath,
        processedDir: path.join(PROCESSED_ROOT, site, country, language, SERIES),
        previewDir: path.join(PREVIEW_ROOT, site, country, language, SERIES),
      });
      continue;
    }

    results.push(...(await findPageDirectories(fullPath)));
  }

  return results;
}

async function migratePageDirectory(pageDir: PageDirectory): Promise<number> {
  const { site, country, language, sourceDir, processedDir, previewDir } = pageDir;
  console.log(`\nProcessing ${site}/${country}/${language}/${SERIES}`);

  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  const htmlFiles = entries
    .filter((entry) => entry.isFile() && isHtmlFile(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (htmlFiles.length === 0) {
    console.log('  No matching HTML files found.');
    return 0;
  }

  await ensureDir(processedDir);
  await ensureDir(previewDir);

  // The preview viewer uses this list to navigate the converted files.
  // Only successfully converted files are included.
  const lessons: string[] = [];

  for (const [index, fileName] of htmlFiles.entries()) {
    const lessonName = toLessonName(fileName);
    const sortOrder = index + 1;
    const sourcePath = path.join(sourceDir, fileName);
    const jsonFileName = `${lessonName}.json`;
    const processedPath = path.join(processedDir, jsonFileName);
    const previewPath = path.join(previewDir, jsonFileName);

    const html = await fs.readFile(sourcePath, 'utf8');
    const json = transformMyfriends(html, {
      site,
      country: country as TransformContext['country'],
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
    console.log(`  Migrated ${fileName} (sortOrder: ${sortOrder})`);
  }

  const previewIndexPath = path.join(previewDir, 'index.json');
  await fs.writeFile(previewIndexPath, `${JSON.stringify(lessons, null, 2)}\n`, 'utf8');
  console.log(`  Preview index: ${previewIndexPath}`);
  console.log(`  Completed ${lessons.length} pages.`);

  return lessons.length;
}

async function run(): Promise<void> {
  console.log(`Searching recursively: ${RAW_ROOT}`);
  const pageDirectories = await findPageDirectories(RAW_ROOT);
  pageDirectories.sort((a, b) => a.sourceDir.localeCompare(b.sourceDir));

  console.log(`Found ${pageDirectories.length} pages directories.`);

  let successfulDirectories = 0;
  let failedDirectories = 0;
  let totalPages = 0;

  for (const pageDir of pageDirectories) {
    try {
      totalPages += await migratePageDirectory(pageDir);
      successfulDirectories++;
    } catch (error) {
      failedDirectories++;
      console.error(`Failed: ${pageDir.site}/${pageDir.country}/${pageDir.language}`);
      console.error(error);
    }
  }

  console.log('\nMigration complete.');
  console.log(`Directories found: ${pageDirectories.length}`);
  console.log(`Successful:        ${successfulDirectories}`);
  console.log(`Failed:            ${failedDirectories}`);
  console.log(`Pages migrated:    ${totalPages}`);

  if (failedDirectories > 0) process.exitCode = 1;
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
