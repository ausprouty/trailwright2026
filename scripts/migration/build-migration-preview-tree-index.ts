/* This script builds an index of the migration preview tree for the "My Friends" data.
## It reads the directory structure under the specified raw data directory and creates a JSON file that represents the hierarchy of countries, languages, and series.

## Usage: npx tsx scripts/migration/build-migration-preview-tree-index.ts

*/
import fs from 'node:fs';
import path from 'node:path';

type MigrationPreviewTreeIndex = Record<string, Record<string, string[]>>;

const RAW_MYFRIENDS_DIR = 'c:/ampp/htdocs/trailwright/data/raw/myfriends';

const OUTPUT_FILE = 'c:/ampp/htdocs/trailwright/public/migration-preview/myfriends/index.json';

function isDirectory(fullPath: string): boolean {
  try {
    return fs.statSync(fullPath).isDirectory();
  } catch {
    return false;
  }
}

function getDirectoryNames(parentDir: string): string[] {
  if (!fs.existsSync(parentDir)) {
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

function buildMigrationPreviewTreeIndex(rawRootDir: string): MigrationPreviewTreeIndex {
  const index: MigrationPreviewTreeIndex = {};

  const countries = getDirectoryNames(rawRootDir);

  for (const country of countries) {
    const countryDir = path.join(rawRootDir, country);
    const languages = getDirectoryNames(countryDir);

    if (!languages.length) {
      continue;
    }

    index[country] = {};

    for (const language of languages) {
      const languageDir = path.join(countryDir, language);
      const seriesList = getDirectoryNames(languageDir);

      if (!seriesList.length) {
        continue;
      }

      index[country][language] = seriesList;
    }

    if (!Object.keys(index[country]).length) {
      delete index[country];
    }
  }

  return index;
}

function writeJsonFile(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

const index = buildMigrationPreviewTreeIndex(RAW_MYFRIENDS_DIR);

writeJsonFile(OUTPUT_FILE, index);

console.log(`Wrote migration preview tree index: ${OUTPUT_FILE}`);
console.log(`Countries: ${Object.keys(index).length}`);

for (const [country, languages] of Object.entries(index)) {
  const languageCount = Object.keys(languages).length;
  const seriesCount = Object.values(languages).reduce((total, seriesList) => {
    return total + seriesList.length;
  }, 0);

  console.log(`${country}: ${languageCount} languages, ${seriesCount} series`);
}
