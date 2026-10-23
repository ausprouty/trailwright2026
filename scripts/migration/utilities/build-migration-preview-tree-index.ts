
/**
 * BUILD MIGRATION PREVIEW TREE INDEX
 *
 * PURPOSE
 * -------
 * Builds site-level index.json files based on the RAW data directory
 * structure for My Friends and MC2.
 *
 * The index records the available countries, languages, and series.
 *
 * USAGE
 * -----
 * Run from the project root:
 *
 *   npx tsx scripts/migration/utilities/build-migration-preview-tree-index.ts myfriends
 *   npx tsx scripts/migration/utilities/build-migration-preview-tree-index.ts mc2
 *   npx tsx scripts/migration/utilities/build-migration-preview-tree-index.ts all
 *
 * Running without an argument is equivalent to "all".
 *
 * INPUT DIRECTORIES
 * -----------------
 *   data/raw/myfriends/
 *   data/raw/mc2/
 *
 * Expected structure:
 *
 *   data/raw/
 *     myfriends/
 *       AU/
 *         eng/
 *           basics/
 *           compass/
 *       AT/
 *         deu/
 *           basics/
 *
 *     mc2/
 *       AU/
 *         eng/
 *           multiply1/
 *           multiply2/
 *
 * OUTPUT FILES
 * ------------
 *   public/migration-preview/myfriends/index.json
 *   public/migration-preview/mc2/index.json
 *
 * Example output:
 *
 * {
 *   "AU": {
 *     "eng": ["basics", "compass"]
 *   },
 *   "AT": {
 *     "deu": ["basics"]
 *   }
 * }
 *
 * BEHAVIOUR
 * ---------
 * - Discovers countries, languages, and series automatically.
 * - Sorts directory names alphabetically.
 * - Includes series folders even if they contain no lesson JSON files.
 * - Excludes countries and languages without series directories.
 * - Skips sites whose raw directory does not exist.
 * - Creates output directories when necessary.
 * - Overwrites existing site-level index.json files.
 * - Does not read, transform, or modify lesson content.
 *
 * IMPORTANT
 * ---------
 * This script builds the index from the RAW directory tree.
 *
 * The separate build-migration-preview-index.ts script builds its
 * index from GENERATED lesson JSON files.
 *
 * Both scripts write to the same site-level index.json files,
 * so whichever script runs last determines their contents.
 */

import fs from 'node:fs';
import path from 'node:path';

type Site = 'myfriends' | 'mc2';
type SiteSelection = Site | 'all';

type MigrationPreviewTreeIndex = Record<
  string,
  Record<string, string[]>
>;

const PROJECT_ROOT = process.cwd();

const RAW_ROOT = path.join(PROJECT_ROOT, 'data', 'raw');

const OUTPUT_ROOT = path.join(
  PROJECT_ROOT,
  'public',
  'migration-preview',
);

function isDirectory(fullPath: string): boolean {
  try {
    return fs.statSync(fullPath).isDirectory();
  } catch {
    return false;
  }
}

function getDirectoryNames(parentDir: string): string[] {
  if (!isDirectory(parentDir)) {
    return [];
  }

  return fs
    .readdirSync(parentDir)
    .filter((name) => {
      const fullPath = path.join(parentDir, name);
      return isDirectory(fullPath);
    })
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Builds:
 *
 * {
 *   country: {
 *     language: [series1, series2, ...]
 *   }
 * }
 *
 * Uses folder names only. Does not examine lesson files.
 */
function buildMigrationPreviewTreeIndex(
  rawRootDir: string,
): MigrationPreviewTreeIndex {
  const index: MigrationPreviewTreeIndex = {};

  for (const country of getDirectoryNames(rawRootDir)) {
    const countryDir = path.join(rawRootDir, country);

    for (const language of getDirectoryNames(countryDir)) {
      const languageDir = path.join(countryDir, language);
      const seriesList = getDirectoryNames(languageDir);

      if (seriesList.length === 0) {
        continue;
      }

      index[country] ??= {};
      index[country][language] = seriesList;
    }
  }

  return index;
}

function writeJsonFile(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  fs.writeFileSync(
    filePath,
    `${JSON.stringify(data, null, 2)}\n`,
    'utf8',
  );
}

/**
 * Processes one site.
 */
function processSite(site: Site): void {
  const rawDir = path.join(RAW_ROOT, site);

  const outputFile = path.join(
    OUTPUT_ROOT,
    site,
    'index.json',
  );

  if (!isDirectory(rawDir)) {
    console.log(`Skipping ${site}: directory not found: ${rawDir}`);
    return;
  }

  const index = buildMigrationPreviewTreeIndex(rawDir);

  writeJsonFile(outputFile, index);

  console.log(`\nWrote migration preview tree index: ${outputFile}`);
  console.log(`Countries: ${Object.keys(index).length}`);

  for (const [country, languages] of Object.entries(index)) {
    const languageCount = Object.keys(languages).length;

    const seriesCount = Object.values(languages).reduce(
      (total, seriesList) => total + seriesList.length,
      0,
    );

    console.log(
      `${country}: ${languageCount} languages, ${seriesCount} series`,
    );
  }
}

/**
 * MAIN
 *
 * Optional command-line argument:
 *   myfriends | mc2 | all
 *
 * Defaults to all.
 */
function main(): void {
  const selection = (
    process.argv[2] ?? 'all'
  ).toLowerCase() as SiteSelection;

  if (!['myfriends', 'mc2', 'all'].includes(selection)) {
    console.error(
      'Invalid site. Use: myfriends, mc2, or all.',
    );
    process.exitCode = 1;
    return;
  }

  const sites: Site[] =
    selection === 'all'
      ? ['myfriends', 'mc2']
      : [selection];

  for (const site of sites) {
    processSite(site);
  }
}

main();
