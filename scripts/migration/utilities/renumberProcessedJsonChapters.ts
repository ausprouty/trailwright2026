
/**
 * RENUMBER PROCESSED JSON CHAPTERS
 *
 * PURPOSE
 * -------
 * Recursively scans all JSON files under data/processed_json/
 * and ensures that chapter IDs are sequential, starting at 0.
 *
 * Only JSON files containing a top-level "chapters" array
 * are processed.
 *
 * USAGE
 * -----
 * Run from the project root:
 *
 * Preview changes without modifying files:
 *
 *   npx tsx scripts/migration/renumberProcessedJsonChapters.ts --dry-run
 *
 * Apply changes:
 *
 *   npx tsx scripts/migration/renumberProcessedJsonChapters.ts
 *
 * INPUT DIRECTORY
 * ---------------
 *   data/processed_json/
 *
 * All subdirectories are searched recursively.
 *
 * Example:
 *
 *   data/processed_json/
 *     myfriends/
 *       AU/
 *         eng/
 *           multiply1/
 *             index.json
 *           life/
 *             index.json
 *
 * INPUT FORMAT
 * ------------
 * A JSON file containing a chapters array:
 *
 * {
 *   "description": "Multiply 1",
 *   "chapters": [
 *     { "id": null, "title": "Introduction" },
 *     { "id": 5, "title": "Lesson 1" },
 *     { "id": 9, "title": "Lesson 2" }
 *   ]
 * }
 *
 * OUTPUT FORMAT
 * -------------
 * Chapter IDs are replaced with sequential integers:
 *
 * {
 *   "description": "Multiply 1",
 *   "chapters": [
 *     { "id": 0, "title": "Introduction" },
 *     { "id": 1, "title": "Lesson 1" },
 *     { "id": 2, "title": "Lesson 2" }
 *   ]
 * }
 *
 * OUTPUT LOCATION
 * ---------------
 * Files are modified in place.
 *
 * No new files or directories are created.
 * Existing files are overwritten only when chapter IDs need fixing.
 *
 * BEHAVIOUR
 * ---------
 * - Searches all subdirectories recursively.
 * - Processes .json files containing a top-level chapters array.
 * - Ignores JSON files without a chapters array.
 * - Skips invalid JSON files with a warning.
 * - Renumbers chapter IDs starting at 0.
 * - Uses chapter array position to determine each ID.
 * - Preserves chapter order, titles, filenames and other properties.
 * - Does not rewrite files whose chapter IDs are already correct.
 * - Supports --dry-run to preview changes without writing.
 * - Sorts filenames naturally for predictable processing order.
 *
 * CONSOLE OUTPUT
 * --------------
 * OK      Chapter IDs are already sequential.
 * WOULD   Chapter IDs need changing (--dry-run only).
 * FIXED   Chapter IDs were corrected and saved.
 *
 * LIMITATIONS
 * -----------
 * - Always scans data/processed_json/.
 * - Does not accept a site, country or language filter.
 * - Does not create backups before overwriting files.
 * - Does not modify references to chapter IDs in other files.
 * - Does not modify migration-preview or public/content files.
 *
 * IMPORTANT
 * ---------
 * Chapter IDs are determined by their position in the array.
 *
 * If chapters are reordered, running this script again will
 * assign new IDs reflecting the new order.
 *
 * Use --dry-run before applying changes to review which files
 * will be modified.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

type JsonObject = {
  [key: string]: unknown;
};

type Chapter = {
  id?: number | null;
  title?: string;
  filename?: string;
  [key: string]: unknown;
};

type ChapterJson = JsonObject & {
  chapters: Chapter[];
};

type Options = {
  dryRun: boolean;
};

type RenumberResult = {
  changed: boolean;
  count: number;
};

// -----------------------------------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------------------------------

const PROJECT_ROOT = process.cwd();

const ROOT_DIR = path.join(
  PROJECT_ROOT,
  'data',
  'processed_json',
);

// -----------------------------------------------------------------------------
// FILE SYSTEM HELPERS
// -----------------------------------------------------------------------------

/**
 * Check whether a file or directory exists.
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Recursively collect all .json files in a directory.
 *
 * Results are sorted naturally so that:
 *   lesson2.json comes before lesson10.json.
 */
async function getJsonFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, {
    withFileTypes: true,
  });

  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await getJsonFiles(fullPath)));
      continue;
    }

    if (
      entry.isFile() &&
      entry.name.toLowerCase().endsWith('.json')
    ) {
      files.push(fullPath);
    }
  }

  return files.sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
}

// -----------------------------------------------------------------------------
// JSON VALIDATION
// -----------------------------------------------------------------------------

/**
 * Check whether parsed JSON contains a chapters array.
 *
 * Files without a chapters array are ignored.
 */
function isChapterJson(data: unknown): data is ChapterJson {
  if (
    data === null ||
    typeof data !== 'object' ||
    Array.isArray(data)
  ) {
    return false;
  }

  const maybe = data as JsonObject;

  return Array.isArray(maybe.chapters);
}

// -----------------------------------------------------------------------------
// CHAPTER RENUMBERING
// -----------------------------------------------------------------------------

/**
 * Renumber chapters sequentially, starting at 0.
 *
 * Returns:
 *   changed: true if any chapter ID needed correction.
 *   count:   number of chapters in the array.
 *
 * Other chapter properties are preserved.
 */
function renumberChapters(data: ChapterJson): RenumberResult {
  let changed = false;

  data.chapters = data.chapters.map((chapter, index) => {
    if (chapter.id !== index) {
      changed = true;
    }

    return {
      ...chapter,
      id: index,
    };
  });

  return {
    changed,
    count: data.chapters.length,
  };
}

// -----------------------------------------------------------------------------
// PROCESS ONE JSON FILE
// -----------------------------------------------------------------------------

/**
 * Read, validate and renumber a JSON file.
 *
 * If --dry-run is enabled, report the required changes
 * without writing to disk.
 *
 * Files with correct chapter IDs are not rewritten.
 */
async function processJsonFile(
  filePath: string,
  options: Options,
): Promise<void> {
  const relativePath = path.relative(ROOT_DIR, filePath);

  const raw = await fs.readFile(filePath, 'utf8');

  let data: unknown;

  try {
    data = JSON.parse(raw);
  } catch {
    console.warn(`Skipping invalid JSON: ${relativePath}`);
    return;
  }

  if (!isChapterJson(data)) {
    return;
  }

  const { changed, count } = renumberChapters(data);

  if (!changed) {
    console.log(`OK      ${relativePath} (${count} chapters)`);
    return;
  }

  if (options.dryRun) {
    console.log(`WOULD   ${relativePath} (${count} chapters)`);
    return;
  }

  const output = `${JSON.stringify(data, null, 2)}\n`;

  await fs.writeFile(filePath, output, 'utf8');

  console.log(`FIXED   ${relativePath} (${count} chapters)`);
}

// -----------------------------------------------------------------------------
// MAIN
// -----------------------------------------------------------------------------

/**
 * Scan all JSON files and correct chapter IDs where necessary.
 *
 * Command-line option:
 *   --dry-run   Report changes without modifying files.
 */
async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  if (!(await fileExists(ROOT_DIR))) {
    throw new Error(`Directory not found: ${ROOT_DIR}`);
  }

  const jsonFiles = await getJsonFiles(ROOT_DIR);

  console.log(`Scanning ${jsonFiles.length} JSON files`);
  console.log(`Directory: ${ROOT_DIR}`);
  console.log(dryRun ? 'Mode: dry run' : 'Mode: write changes');
  console.log('');

  for (const filePath of jsonFiles) {
    await processJsonFile(filePath, { dryRun });
  }

  console.log('');
  console.log('Done.');
}

// -----------------------------------------------------------------------------
// EXECUTION
// -----------------------------------------------------------------------------

main().catch((error: unknown) => {
  console.error('\nChapter renumbering failed.');
  console.error(error);
  process.exitCode = 1;
});
