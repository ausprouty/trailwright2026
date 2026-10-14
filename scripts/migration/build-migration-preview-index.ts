// Run: npx tsx scripts/migration/build-migration-preview-index.ts
// Builds ONLY the site-level index used by MigrationPreviewIndex.
// Does not read raw HTML, transform content, or modify lesson JSON files.

import fs from 'node:fs/promises';
import path from 'node:path';

const PREVIEW_ROOT = path.join(process.cwd(), 'public', 'migration-preview');

type MigrationPreviewIndex = Record<string, Record<string, string[]>>;

async function subdirectories(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function hasLessonJson(dir: string): Promise<boolean> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.some(
    (entry) =>
      entry.isFile() &&
      entry.name.toLowerCase().endsWith('.json') &&
      entry.name.toLowerCase() !== 'index.json',
  );
}

async function run(): Promise<void> {
  const sites = await subdirectories(PREVIEW_ROOT);

  for (const site of sites) {
    const siteDir = path.join(PREVIEW_ROOT, site);
    const index: MigrationPreviewIndex = {};

    for (const country of await subdirectories(siteDir)) {
      const countryDir = path.join(siteDir, country);

      for (const language of await subdirectories(countryDir)) {
        const languageDir = path.join(countryDir, language);
        const seriesNames: string[] = [];

        for (const series of await subdirectories(languageDir)) {
          if (await hasLessonJson(path.join(languageDir, series))) {
            seriesNames.push(series);
          }
        }

        if (seriesNames.length > 0) {
          index[country] ??= {};
          index[country][language] = seriesNames;
        }
      }
    }

    if (Object.keys(index).length === 0) {
      console.log(`Skipping ${site}: no lesson JSON files found.`);
      continue;
    }

    const indexPath = path.join(siteDir, 'index.json');
    await fs.writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
    console.log(`Created ${indexPath}`);
  }
}

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
