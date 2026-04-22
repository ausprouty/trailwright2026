#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();

const RAW_ROOT = path.join(PROJECT_ROOT, 'data', 'raw', 'myfriends');

const PROCESSED_ROOT = path.join(PROJECT_ROOT, 'data', 'processed', 'myfriends');

const PREVIEW_ROOT = path.join(PROJECT_ROOT, 'public', 'migration-preview', 'myfriends');

const args = process.argv.slice(2);
const seriesName: string = args[0] || '';
const countryFilter: string = args[1] || '';
const languageFilter: string = args[2] || '';

if (!seriesName) {
  console.error(
    'Usage: node scripts/migration/migrate-series-tree.mjs <series> [country] [language]',
  );
  console.error('Example: node scripts/migration/migrate-series-tree.mjs life AU eng');
  process.exit(1);
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(targetPath: string): Promise<void> {
  await fs.mkdir(targetPath, { recursive: true });
}

async function listDirectories(parentPath: string): Promise<string[]> {
  const entries = await fs.readdir(parentPath, {
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function listFiles(parentPath: string): Promise<string[]> {
  const entries = await fs.readdir(parentPath, {
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function toJsonFileName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/u, '.json');
}

function isLifeHtmlFile(fileName: string): boolean {
  return /^life\d+\.html$/iu.test(fileName);
}

type MigrationContext = {
  country: string;
  language: string;
  series: string;
  sourceFile: string;
};

type Transformer = (html: string, context: MigrationContext) => unknown;

async function loadTransformer(series: string): Promise<Transformer> {
  if (series === 'life') {
    const module = await import('./life/transformLife');
    return module.transformLife as Transformer;
  }

  throw new Error(`No transformer configured for series: ${series}`);
}

type MigrateOneFileParams = {
  transformer: Transformer;
  sourceFilePath: string;
  processedFilePath: string;
  previewFilePath: string;
  context: MigrationContext;
};

async function migrateOneFile({
  transformer,
  sourceFilePath,
  processedFilePath,
  previewFilePath,
  context,
}: MigrateOneFileParams) {
  const html = await fs.readFile(sourceFilePath, 'utf8');
  const json = transformer(html, context);
  const jsonText = JSON.stringify(json, null, 2);

  await fs.writeFile(processedFilePath, jsonText, 'utf8');
  await fs.writeFile(previewFilePath, jsonText, 'utf8');
}

type ProcessSeriesFolderParams = {
  transformer: Transformer;
  country: string;
  language: string;
  seriesName: string;
  sourceSeriesPath: string;
};

async function processSeriesFolder({
  transformer,
  country,
  language,
  seriesName,
  sourceSeriesPath,
}: ProcessSeriesFolderParams): Promise<number> {
  const processedSeriesPath = path.join(PROCESSED_ROOT, country, language, seriesName);

  const previewSeriesPath = path.join(PREVIEW_ROOT, country, language, seriesName);

  await ensureDir(processedSeriesPath);
  await ensureDir(previewSeriesPath);

  const allFiles = await listFiles(sourceSeriesPath);

  let files = allFiles;

  if (seriesName === 'life') {
    files = allFiles.filter((fileName) => isLifeHtmlFile(fileName));
  }

  if (files.length === 0) {
    console.log(`Skipping empty or non-matching folder: ${sourceSeriesPath}`);
    return 0;
  }

  console.log(`\nProcessing ${country}/${language}/${seriesName}`);
  console.log(`Source:    ${sourceSeriesPath}`);
  console.log(`Processed: ${processedSeriesPath}`);
  console.log(`Preview:   ${previewSeriesPath}`);

  for (const fileName of files) {
    const sourceFilePath = path.join(sourceSeriesPath, fileName);
    const jsonFileName = toJsonFileName(fileName);

    const processedFilePath = path.join(processedSeriesPath, jsonFileName);

    const previewFilePath = path.join(previewSeriesPath, jsonFileName);

    await migrateOneFile({
      transformer,
      sourceFilePath,
      processedFilePath,
      previewFilePath,
      context: {
        country,
        language,
        series: seriesName,
        sourceFile: fileName,
      },
    });

    console.log(`  ✓ ${fileName} -> ${jsonFileName}`);
  }

  return files.length;
}

async function main() {
  if (!(await pathExists(RAW_ROOT))) {
    throw new Error(`Raw root not found: ${RAW_ROOT}`);
  }

  const transformer = await loadTransformer(seriesName);
  let countries = await listDirectories(RAW_ROOT);

  if (countryFilter) {
    countries = countries.filter((country) => country === countryFilter);
  }

  let foldersFound = 0;
  let filesProcessed = 0;

  for (const country of countries) {
    const countryPath = path.join(RAW_ROOT, country);
    let languages = await listDirectories(countryPath);

    if (languageFilter) {
      languages = languages.filter((language) => language === languageFilter);
    }

    for (const language of languages) {
      const sourceSeriesPath = path.join(countryPath, language, seriesName);

      if (!(await pathExists(sourceSeriesPath))) {
        continue;
      }

      foldersFound += 1;

      filesProcessed += await processSeriesFolder({
        transformer,
        country,
        language,
        seriesName,
        sourceSeriesPath,
      });
    }
  }

  if (foldersFound === 0) {
    console.log(`No folders found for series "${seriesName}" under ${RAW_ROOT}`);
    return;
  }

  console.log('\nDone.');
  console.log(`Folders found: ${foldersFound}`);
  console.log(`Files processed: ${filesProcessed}`);
}
main().catch((error) => {
  console.error('\nMigration failed.');
  console.error(error);
  process.exit(1);
});
