#! npx tsx scripts/migration/json/write-json-export.ts data/sql_exports/myfriends/json_content.json


/**
 * WRITE JSON EXPORT
 *
 * PURPOSE
 * -------
 * Extracts individual JSON files from a legacy MyFriends
 * SQL database export.
 *
 * The source is a JSON export of the MariaDB json_content table.
 * Each database record contains JSON content stored in its
 * "text" field, along with country, language, folder and filename.
 *
 * The script selects the latest version of each logical file,
 * validates its JSON content, and writes it to the appropriate
 * directory under data/processed_json/myfriends/.
 *
 * USAGE
 * -----
 * Run from the project root:
 *
 * Using the default input file:
 *
 *   npx tsx scripts/migration/json/write-json-export.ts
 *
 * Specifying an input file:
 *
 *   npx tsx scripts/migration/json/write-json-export.ts data/sql_exports/myfriends/json_content.json
 *
 * INPUT FILE
 * ----------
 * Default:
 *
 *   data/sql_exports/myfriends/json_content.json
 *
 * Accepts either:
 *
 * 1. An array of database records.
 *
 * 2. A phpMyAdmin-style JSON export containing a table entry
 *    with type="table" and a data array.
 *
 * Expected record fields:
 *
 *   recnum        Database record number
 *   language_iso  Language code (e.g. eng, deu)
 *   country_code  Country code (e.g. AU, AT)
 *   folder_name   Series or content folder (e.g. basics)
 *   filetype      Content type (must be "json")
 *   filename      Original filename
 *   text          JSON content stored in the database
 *
 * RECORD SELECTION
 * ----------------
 * Only records where filetype === "json" are processed.
 *
 * Records are grouped using:
 *
 *   language_iso | country_code | folder_name | filename
 *
 * When duplicate records exist for the same logical file,
 * only the record with the highest numeric recnum is retained.
 *
 * The highest recnum is assumed to represent the latest version.
 *
 * OUTPUT DIRECTORY
 * ----------------
 *   data/processed_json/myfriends/
 *
 * Expected structure:
 *
 *   data/processed_json/
 *     myfriends/
 *       AU/
 *         eng/
 *           basics/
 *             lesson1.json
 *             lesson2.json
 *           compass/
 *             lesson1.json
 *       AT/
 *         deu/
 *           basics/
 *             lesson1.json
 *
 * Example:
 *
 * Database record:
 *
 *   country_code: AU
 *   language_iso: eng
 *   folder_name:  basics
 *   filename:     lesson1
 *
 * Output:
 *
 *   data/processed_json/myfriends/AU/eng/basics/lesson1.json
 *
 * If the filename does not end in .json, the extension is added.
 * Country, language and folder components are omitted when blank.
 *
 * JSON VALIDATION
 * ---------------
 * Each selected record's text field is parsed using JSON.parse().
 *
 * If the content is valid:
 * - The JSON is formatted with 2-space indentation.
 * - A final newline is added.
 * - The required output directory is created.
 * - The JSON file is written to disk.
 *
 * If the content is invalid:
 * - The record is skipped.
 * - A warning is printed.
 * - Processing continues with the next record.
 *
 * Records with blank filenames are also skipped.
 *
 * BEHAVIOUR
 * ---------
 * - Reads one SQL JSON export file.
 * - Selects only records with filetype="json".
 * - Groups records by language, country, folder and filename.
 * - Keeps the record with the highest recnum in each group.
 * - Skips records with blank filenames.
 * - Skips records containing invalid JSON text.
 * - Creates missing output directories automatically.
 * - Writes individual, formatted JSON files.
 * - Overwrites existing files with the same output path.
 * - Does not delete files no longer present in the export.
 * - Does not modify the original SQL export.
 *
 * CONSOLE OUTPUT
 * --------------
 * Reports:
 *
 * - Total rows in the export
 * - Rows with filetype=json
 * - Latest unique JSON files
 * - Number of files written
 * - Number skipped because filenames were blank
 * - Number skipped because JSON content was invalid
 *
 * LIMITATIONS
 * -----------
 * - Hard-coded to the MyFriends output directory.
 * - Does not support MC2.
 * - Does not provide a --dry-run option.
 * - Does not create backups before overwriting files.
 * - Does not verify the structure of individual lesson JSON.
 * - Assumes higher recnum means a newer record.
 * - Does not normalize or transform lesson content.
 * - Does not generate migration-preview files.
 * - Does not rebuild site-level or series-level indexes.
 * - Does not validate output path components for safety.
 * - Does not detect collisions caused by filename variations
 *   such as "lesson1" and "lesson1.json".
 *
 * IMPORTANT
 * ---------
 * This script WRITES files and may overwrite existing content.
 *
 * Before running it against an unfamiliar SQL export, use:
 *
 *   npx tsx scripts/migration/json/inspect-json-export.ts
 *
 * That companion script previews the records, identifies invalid
 * JSON and displays expected output paths without writing files.
 *
 * WORKFLOW
 * --------
 * 1. Export the legacy json_content table from MariaDB as JSON.
 *
 * 2. Inspect the export:
 *      inspect-json-export.ts
 *
 * 3. Extract the individual JSON files:
 *      write-json-export.ts
 *
 * 4. Optionally repair sequential chapter IDs:
 *      renumberProcessedJsonChapters.ts
 *
 * NOTE
 * ----
 * This script belongs to the SQL JSON extraction workflow,
 * not the HTML-to-JSON lesson migration workflow.
 *
 * It is useful for recovering or rebuilding legacy database
 * content but is not required for routine HTML lesson migrations.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

type SqlJsonRecord = {
  recnum: string;
  language_iso: string | null;
  country_code: string | null;
  folder_name: string | null;
  filetype: string | null;
  filename: string | null;
  text: string | null;
};

const PROJECT_ROOT = process.cwd();

const INPUT_FILE =
  process.argv[2] ||
  path.join(PROJECT_ROOT, 'data', 'sql_exports', 'myfriends', 'json_content.json');

const OUTPUT_ROOT = path.join(PROJECT_ROOT, 'data', 'processed_json', 'myfriends');

function clean(value: string | null | undefined): string {
  return String(value || '').trim();
}

function ensureJsonFilename(filename: string): string {
  const cleaned = clean(filename);

  if (cleaned.toLowerCase().endsWith('.json')) {
    return cleaned;
  }

  return `${cleaned}.json`;
}

function buildGroupKey(record: SqlJsonRecord): string {
  return [
    clean(record.language_iso),
    clean(record.country_code),
    clean(record.folder_name),
    clean(record.filename),
  ].join('|');
}

function buildOutputPath(record: SqlJsonRecord): string {
  const countryCode = clean(record.country_code);
  const languageIso = clean(record.language_iso);
  const folderName = clean(record.folder_name);
  const filename = ensureJsonFilename(clean(record.filename));

  const parts = [OUTPUT_ROOT];

  if (countryCode) {
    parts.push(countryCode);
  }

  if (countryCode && languageIso) {
    parts.push(languageIso);
  }

  if (countryCode && languageIso && folderName) {
    parts.push(folderName);
  }

  parts.push(filename);

  return path.join(...parts);
}

function extractRecords(parsed: unknown): SqlJsonRecord[] {
  if (!Array.isArray(parsed)) {
    throw new Error('Export file is not a JSON array.');
  }

  const tableExport = parsed.find((item) => {
    return (
      typeof item === 'object' &&
      item !== null &&
      'type' in item &&
      'data' in item &&
      (item as { type: unknown }).type === 'table' &&
      Array.isArray((item as { data: unknown }).data)
    );
  });

  if (tableExport) {
    return (tableExport as { data: SqlJsonRecord[] }).data;
  }

  return parsed as SqlJsonRecord[];
}

async function main(): Promise<void> {
  console.log('--- JSON EXPORT WRITER ---');
  console.log(`Input:  ${INPUT_FILE}`);
  console.log(`Output: ${OUTPUT_ROOT}`);

  const raw = await fs.readFile(INPUT_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  const records = extractRecords(parsed);

  const jsonRows = records.filter((record) => record.filetype === 'json');

  const latestByKey = new Map<string, SqlJsonRecord>();

  for (const record of jsonRows) {
    const key = buildGroupKey(record);
    const existing = latestByKey.get(key);

    if (!existing || Number(record.recnum) > Number(existing.recnum)) {
      latestByKey.set(key, record);
    }
  }

  const latestRecords = Array.from(latestByKey.values());

  let writtenCount = 0;
  let skippedBlankFilenameCount = 0;
  let invalidJsonCount = 0;

  for (const record of latestRecords) {
    const filename = clean(record.filename);

    if (!filename) {
      skippedBlankFilenameCount += 1;
      console.log(`SKIP blank filename: recnum=${record.recnum}`);
      continue;
    }

    let parsedText: unknown;

    try {
      parsedText = JSON.parse(record.text || '');
    } catch {
      invalidJsonCount += 1;
      console.log(`SKIP invalid JSON: recnum=${record.recnum}, filename=${filename}`);
      continue;
    }

    const outputPath = buildOutputPath(record);
    const outputDir = path.dirname(outputPath);
    const prettyJson = `${JSON.stringify(parsedText, null, 2)}\n`;

    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, prettyJson, 'utf8');

    writtenCount += 1;
  }

  console.log('');
  console.log('Done.');
  console.log(`Rows in export: ${records.length}`);
  console.log(`Rows with filetype=json: ${jsonRows.length}`);
  console.log(`Latest unique JSON files: ${latestRecords.length}`);
  console.log(`Files written: ${writtenCount}`);
  console.log(`Skipped blank filename: ${skippedBlankFilenameCount}`);
  console.log(`Skipped invalid JSON: ${invalidJsonCount}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
