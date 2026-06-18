// npx tsx scripts/migration/rebuild-preview-lesson-indexes.ts

import fs from 'node:fs';
import path from 'node:path';

const PREVIEW_ROOT = 'c:/ampp/htdocs/trailwright/public/migration-preview/myfriends';

function isDirectory(fullPath: string): boolean {
  try {
    return fs.statSync(fullPath).isDirectory();
  } catch {
    return false;
  }
}

function isFile(fullPath: string): boolean {
  try {
    return fs.statSync(fullPath).isFile();
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
    .filter((name) => isDirectory(path.join(parentDir, name)))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function getLessonIds(seriesDir: string): string[] {
  if (!fs.existsSync(seriesDir)) {
    return [];
  }

  return fs
    .readdirSync(seriesDir)
    .filter((fileName) => {
      if (!fileName.endsWith('.json')) {
        return false;
      }

      if (fileName === 'index.json') {
        return false;
      }

      return isFile(path.join(seriesDir, fileName));
    })
    .map((fileName) => fileName.replace(/\.json$/i, ''))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function writeSeriesIndex(seriesDir: string, lessonIds: string[]): void {
  const indexPath = path.join(seriesDir, 'index.json');
  fs.writeFileSync(indexPath, `${JSON.stringify(lessonIds, null, 2)}\n`, 'utf8');
}

function rebuildPreviewLessonIndexes(): void {
  if (!fs.existsSync(PREVIEW_ROOT)) {
    throw new Error(`Preview root not found: ${PREVIEW_ROOT}`);
  }

  let seriesCount = 0;
  let lessonCount = 0;
  let emptySeriesCount = 0;

  const countries = getDirectoryNames(PREVIEW_ROOT);

  for (const country of countries) {
    const countryDir = path.join(PREVIEW_ROOT, country);
    const languages = getDirectoryNames(countryDir);

    for (const language of languages) {
      const languageDir = path.join(countryDir, language);
      const seriesList = getDirectoryNames(languageDir);

      for (const series of seriesList) {
        const seriesDir = path.join(languageDir, series);
        const lessonIds = getLessonIds(seriesDir);

        if (!lessonIds.length) {
          emptySeriesCount += 1;
          console.warn(`Skipped empty series: ${country}/${language}/${series}`);
          continue;
        }

        writeSeriesIndex(seriesDir, lessonIds);

        seriesCount += 1;
        lessonCount += lessonIds.length;

        console.log(
          `Wrote ${country}/${language}/${series}/index.json (${lessonIds.length} lessons)`,
        );
      }
    }
  }

  console.log('');
  console.log('Done rebuilding preview lesson indexes.');
  console.log(`Series indexed: ${seriesCount}`);
  console.log(`Lessons indexed: ${lessonCount}`);
  console.log(`Empty series skipped: ${emptySeriesCount}`);
}

rebuildPreviewLessonIndexes();
