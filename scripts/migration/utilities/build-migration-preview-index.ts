// Run: npx tsx scripts/migration/build-migration-preview-index.ts
/**
 * BUILD MIGRATION PREVIEW INDEX
 *
 * Run from the project root:
 *   npx tsx scripts/migration/build-migration-preview-index.ts
 *
 * PURPOSE
 * -------
 * Builds the site-level index.json files used by MigrationPreviewIndex.
 *
 * INPUT DIRECTORY
 * ---------------
 * Reads the directory structure under:
 *   public/migration-preview/
 *
 * Expected structure:
 *   public/migration-preview/
 *     <site>/
 *       <country>/
 *         <language>/
 *           <series>/
 *             lesson1.json
 *             lesson2.json
 *
 * For example:
 *   public/migration-preview/myfriends/AU/eng/basics/
 *   public/migration-preview/myfriends/AT/deu/compass/
 *
 * A series is included only if its folder contains at least one
 * .json file other than index.json.
 *
 * OUTPUT
 * ------
 * Creates or overwrites one index.json for each site:
 *   public/migration-preview/<site>/index.json
 *
 * Example:
 *   public/migration-preview/myfriends/index.json
 *
 * Output format:
 * {
 *   "AU": {
 *     "eng": ["basics", "compass"]
 *   },
 *   "AT": {
 *     "deu": ["basics", "compass"]
 *   }
 * }
 *
 * BEHAVIOUR
 * ---------
 * - Automatically discovers all sites, countries, languages and series.
 * - Processes all sites found under public/migration-preview/.
 * - Sorts directory names alphabetically.
 * - Excludes series without lesson JSON files.
 * - Skips sites that contain no lesson JSON files.
 * - Overwrites existing site-level index.json files.
 * - Does not delete stale index.json files for skipped sites.
 * - Does not read raw HTML or transform lesson content.
 * - Does not create, modify or delete lesson JSON files.
 *
 * NOTE
 * ----
 * Run this script after generating or updating migration preview
 * lesson JSON files so MigrationPreviewIndex reflects the available
 * countries, languages and series.
 */
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
