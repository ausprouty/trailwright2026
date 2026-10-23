
/**
 * REBUILD MIGRATION PREVIEW LESSON INDEXES
 *
 * PURPOSE
 * -------
 * Creates an index.json inside every series folder containing
 * migrated lesson JSON files.
 *
 * Each index lists the lesson IDs available in that series.
 * The lesson ID is the filename without the .json extension.
 *
 * USAGE
 * -----
 * Run from the project root:
 *
 *   npx tsx scripts/migration/rebuild-preview-lesson-indexes.ts myfriends
 *   npx tsx scripts/migration/rebuild-preview-lesson-indexes.ts mc2
 
 *
 * Running without an argument is equivalent to "all".
 *
 * INPUT DIRECTORIES
 * -----------------
 * Reads generated migration preview JSON files under:
 *
 *   public/migration-preview/myfriends/
 *   public/migration-preview/mc2/
 *
 * Expected directory structure:
 *
 *   public/migration-preview/
 *     myfriends/
 *       AU/
 *         eng/
 *           basics/
 *             lesson1.json
 *             lesson2.json
 *             lesson10.json
 *
 *     mc2/
 *       AU/
 *         eng/
 *           multiply1/
 *             chapter1.json
 *             chapter2.json
 *
 * OUTPUT FILES
 * ------------
 * Creates or overwrites index.json inside each series folder.
 *
 * Example:
 *
 *   public/migration-preview/myfriends/AU/eng/basics/index.json
 *
 * Contents:
 *
 * [
 *   "lesson1",
 *   "lesson2",
 *   "lesson10"
 * ]
 *
 * BEHAVIOUR
 * ---------
 * - Automatically discovers countries, languages, and series.
 * - Processes one site or both sites.
 * - Includes only .json files, excluding index.json.
 * - Removes the .json extension to produce lesson IDs.
 * - Sorts lesson IDs naturally (lesson2 before lesson10).
 * - Creates or overwrites each series-level index.json.
 * - Deletes an existing index.json if the series has no lessons.
 * - Skips sites whose preview directory does not exist.
 * - Does not modify or delete lesson JSON files.
 * - Does not modify site-level index.json files.
 * - Does not read raw HTML or transform lesson content.
 *
 * IMPORTANT
 * ---------
 * This script creates SERIES-LEVEL indexes:
 *
 *   <site>/<country>/<language>/<series>/index.json
 *
 * It does NOT create SITE-LEVEL indexes:
 *
 *   <site>/index.json
 *
 * Use build-migration-preview-index.ts to rebuild site-level
 * indexes after generating lesson JSON files.
 */

import fs from 'node:fs';
import path from 'node:path';

type Site = 'myfriends' | 'mc2';


const PROJECT_ROOT = process.cwd();

const PREVIEW_ROOT = path.join(
  PROJECT_ROOT,
  'public',
  'migration-preview',
);

/**
 * Check whether a path exists and is a directory.
 */
function isDirectory(fullPath: string): boolean {
  try {
    return fs.statSync(fullPath).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check whether a path exists and is a file.
 */
function isFile(fullPath: string): boolean {
  try {
    return fs.statSync(fullPath).isFile();
  } catch {
    return false;
  }
}

/**
 * Return directory names directly inside a parent directory.
 *
 * Results are sorted naturally so numeric portions sort correctly.
 * Returns an empty array if the parent directory does not exist.
 */
function getDirectoryNames(parentDir: string): string[] {
  if (!isDirectory(parentDir)) {
    return [];
  }

  return fs
    .readdirSync(parentDir)
    .filter((name) => isDirectory(path.join(parentDir, name)))
    .sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
}

/**
 * Return lesson IDs from the JSON files in a series folder.
 *
 * Example filenames:
 *   lesson1.json
 *   lesson2.json
 *   lesson10.json
 *   index.json
 *
 * Returns:
 *   ["lesson1", "lesson2", "lesson10"]
 *
 * index.json is excluded because it is not a lesson.
 */
function getLessonIds(seriesDir: string): string[] {
  if (!isDirectory(seriesDir)) {
    return [];
  }

  return fs
    .readdirSync(seriesDir)
    .filter((fileName) => {
      if (!fileName.toLowerCase().endsWith('.json')) {
        return false;
      }

      if (fileName.toLowerCase() === 'index.json') {
        return false;
      }

      return isFile(path.join(seriesDir, fileName));
    })
    .map((fileName) => fileName.replace(/\.json$/i, ''))
    .sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
}

/**
 * Write an index.json containing an array of lesson IDs.
 *
 * Existing index.json files are overwritten.
 */
function writeSeriesIndex(
  seriesDir: string,
  lessonIds: string[],
): void {
  const indexPath = path.join(seriesDir, 'index.json');

  fs.writeFileSync(
    indexPath,
    `${JSON.stringify(lessonIds, null, 2)}\n`,
    'utf8',
  );
}

/**
 * Delete a stale index.json if the series contains no lessons.
 *
 * Does not remove the series directory or any other files.
 */
function removeStaleSeriesIndex(seriesDir: string): void {
  const indexPath = path.join(seriesDir, 'index.json');

  if (isFile(indexPath)) {
    fs.unlinkSync(indexPath);
    console.log(`Removed stale index: ${indexPath}`);
  }
}

/**
 * Process one site (myfriends or mc2).
 *
 * Traverses:
 *   site -> country -> language -> series
 *
 * Creates one index.json per non-empty series.
 */
function rebuildPreviewLessonIndexes(site: Site): void {
  const siteRoot = path.join(PREVIEW_ROOT, site);

  if (!isDirectory(siteRoot)) {
    console.log(`Skipping ${site}: directory not found: ${siteRoot}`);
    return;
  }

  let seriesCount = 0;
  let lessonCount = 0;
  let emptySeriesCount = 0;

  console.log(`\nProcessing site: ${site}`);
  console.log(`Preview root: ${siteRoot}`);

  const countries = getDirectoryNames(siteRoot);

  for (const country of countries) {
    const countryDir = path.join(siteRoot, country);

    const languages = getDirectoryNames(countryDir);

    for (const language of languages) {
      const languageDir = path.join(countryDir, language);

      const seriesList = getDirectoryNames(languageDir);

      for (const series of seriesList) {
        const seriesDir = path.join(languageDir, series);

        const lessonIds = getLessonIds(seriesDir);

        if (lessonIds.length === 0) {
          emptySeriesCount += 1;

          console.warn(
            `Skipped empty series: ${site}/${country}/${language}/${series}`,
          );

          removeStaleSeriesIndex(seriesDir);
          continue;
        }

        writeSeriesIndex(seriesDir, lessonIds);

        seriesCount += 1;
        lessonCount += lessonIds.length;

        console.log(
          `Wrote ${site}/${country}/${language}/${series}/index.json (${lessonIds.length} lessons)`,
        );
      }
    }
  }

  console.log(`\nCompleted: ${site}`);
  console.log(`Series indexed: ${seriesCount}`);
  console.log(`Lessons indexed: ${lessonCount}`);
  console.log(`Empty series skipped: ${emptySeriesCount}`);
}

/**
 * MAIN
 *
 * Accepts:
 *   myfriends | mc2 | all
 *
 * Defaults to all.
 */
function main(): void {
  const selection = (
    process.argv[2] ?? 'all'
  ).toLowerCase();

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
      : [selection as Site];

  for (const site of sites) {
    rebuildPreviewLessonIndexes(site);
  }

  console.log('\nDone rebuilding preview lesson indexes.');
}

main();
