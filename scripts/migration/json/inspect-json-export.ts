#! npx tsx scripts/migration/json/inspect-json-export.ts data/sql_exports/mc2/json_content.json



/**
 * INSPECT SQL JSON EXPORT
 *
 * PURPOSE
 * -------
 * Examines a JSON export of the legacy MyFriends json_content
 * database table before extracting individual JSON files.
 *
 * This is a READ-ONLY diagnostic utility.
 *
 * It identifies:
 * - Records containing JSON content.
 * - Duplicate records representing the same logical file.
 * - The latest record for each file, based on recnum.
 * - Records with missing filenames.
 * - Records containing invalid JSON text.
 * - Expected output paths for extracted JSON files.
 *
 * USAGE
 * -----
 * Run from the project root:
 *
 * Using the default input file:
 *
 *   npx tsx scripts/migration/json/inspect-json-export.ts
 *
 * Specifying an input file:
 *
 *   npx tsx scripts/migration/json/inspect-json-export.ts data/sql_exports/mc2/json_content.json
 *
 * INPUT
 * -----
 * Default:
 *
 *   data/sql_exports/mc2/json_content.json
 *
 * Accepts either:
 *
 * 1. A JSON array of database records.
 *
 * 2. A phpMyAdmin-style JSON export containing a table entry:
 *
 *    {
 *      "type": "table",
 *      "data": [...]
 *    }
 *
 * Expected record fields:
 *
 *   recnum        Database record ID
 *   language_iso  Language code (e.g. eng, deu)
 *   country_code  Country code (e.g. AU, AT)
 *   folder_name   Series or content folder
 *   filetype      Content type (must be "json")
 *   filename      Original filename
 *   text          JSON content stored in the database
 *
 * RECORD SELECTION
 * ----------------
 * Only records with filetype === "json" are examined.
 *
 * Records are grouped by:
 *
 *   language_iso | country_code | folder_name | filename
 *
 * If multiple records share the same group key, the record
 * with the highest numeric recnum is selected.
 *
 * This is assumed to be the latest version.
 *
 * The script does not examine timestamps.
 *
 * VALIDATION
 * ----------
 * After selecting the latest record for each logical file:
 *
 * - Records with blank filenames are reported separately.
 * - Records with filenames are checked using JSON.parse().
 * - Invalid JSON content is reported.
 * - Up to 20 examples of each problem are displayed.
 *
 * EXPECTED OUTPUT DIRECTORY
 * -------------------------
 * The script calculates where extracted files would go:
 *
 *   data/processed_json/mc2/
 *     <country>/
 *       <language>/
 *         <folder>/
 *           <filename>.json
 *
 * Example:
 *
 *   data/processed_json/mc2/AU/eng/basics/lesson1.json
 *
 * Country, language and folder components are omitted when blank.
 *
 * IMPORTANT:
 * These paths are displayed only. No files are created.
 *
 * CONSOLE OUTPUT
 * --------------
 * Reports:
 *
 * - Total database records
 * - Records with filetype=json
 * - Latest unique JSON files
 * - Records with blank filenames
 * - Records with valid filenames
 * - Records containing invalid JSON text
 * - Up to 20 sample output paths
 * - Up to 20 blank filename records
 * - Up to 20 invalid JSON records
 *
 * BEHAVIOUR
 * ---------
 * - Reads one SQL JSON export file.
 * - Selects the highest recnum for duplicate logical files.
 * - Checks whether selected record text contains valid JSON.
 * - Calculates expected extraction destinations.
 * - Does not write, overwrite, move or delete any files.
 * - Does not modify database records.
 * - Does not convert HTML into lesson JSON.
 * - Does not generate migration preview indexes.
 *
 * LIMITATIONS
 * -----------
 * - Hard-coded to the MyFriends output directory.
 * - Does not support MC2.
 * - Assumes higher recnum means a newer record.
 * - Does not verify the structure of parsed lesson JSON.
 * - Does not check whether calculated output files exist.
 * - Does not check for unsafe filename/path components.
 * - Does not validate required country or language fields.
 * - Does not check whether duplicate keys have conflicting data.
 *
 * NOTE
 * ----
 * This script belongs to the SQL JSON extraction workflow,
 * not the HTML-to-JSON lesson migration workflow.
 *
 * It is useful when investigating or re-importing legacy
 * database content but is not required for routine lesson
 * migrations or preview-index generation.
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
  path.join(PROJECT_ROOT, 'data', 'sql_exports', 'mc2', 'json_content.json');

function clean(value: string | null | undefined): string {
  return String(value || '').trim();
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
  const filename = clean(record.filename).replace(/\.json$/i, '');

  const parts = [PROJECT_ROOT, 'data', 'processed_json', 'mc2'];

  if (countryCode) {
    parts.push(countryCode);
  }

  if (countryCode && languageIso) {
    parts.push(languageIso);
  }

  if (countryCode && languageIso && folderName) {
    parts.push(folderName);
  }

  parts.push(`${filename}.json`);

  return path.join(...parts);
}

async function main(): Promise<void> {
  console.log('--- JSON EXPORT DRY RUN INSPECTOR ---');
  console.log(`Input: ${INPUT_FILE}`);

  const raw = await fs.readFile(INPUT_FILE, 'utf8');
  const parsed = JSON.parse(raw);

  let records: SqlJsonRecord[] = [];

  if (Array.isArray(parsed)) {
    const tableExport = parsed.find((item) => item.type === 'table' && Array.isArray(item.data));

    if (tableExport) {
      records = tableExport.data as SqlJsonRecord[];
    } else {
      records = parsed as SqlJsonRecord[];
    }
  }

  if (!Array.isArray(records)) {
    throw new Error('Could not find an array of SQL records in the export file.');
  }

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

  const blankFilenameRows = latestRecords.filter((record) => clean(record.filename) === '');

  const validFilenameRows = latestRecords.filter((record) => clean(record.filename) !== '');

  const invalidJsonRows: SqlJsonRecord[] = [];

  for (const record of validFilenameRows) {
    try {
      JSON.parse(record.text || '');
    } catch {
      invalidJsonRows.push(record);
    }
  }

  console.log('');
  console.log(`Total rows in file: ${records.length}`);
  console.log(`Rows with filetype=json: ${jsonRows.length}`);
  console.log(`Latest unique JSON files: ${latestRecords.length}`);
  console.log(`Rows skipped because filename is blank: ${blankFilenameRows.length}`);
  console.log(`Rows with valid filename: ${validFilenameRows.length}`);
  console.log(`Rows with invalid JSON text: ${invalidJsonRows.length}`);

  console.log('');
  console.log('Sample output paths:');

  for (const record of validFilenameRows.slice(0, 20)) {
    console.log(buildOutputPath(record));
  }

  if (blankFilenameRows.length > 0) {
    console.log('');
    console.log('Blank filename rows:');

    for (const record of blankFilenameRows.slice(0, 20)) {
      console.log(
        `recnum=${record.recnum}, country=${clean(record.country_code)}, ` +
          `language=${clean(record.language_iso)}, folder=${clean(record.folder_name)}`,
      );
    }
  }

  if (invalidJsonRows.length > 0) {
    console.log('');
    console.log('Invalid JSON rows:');

    for (const record of invalidJsonRows.slice(0, 20)) {
      console.log(
        `recnum=${record.recnum}, filename=${clean(record.filename)}, ` +
          `country=${clean(record.country_code)}, language=${clean(record.language_iso)}`,
      );
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
