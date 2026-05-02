#! npx tsx scripts/migration/json/inspect-json-export.ts data/sql_exports/myfriends/json_content.json

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

  const parts = [PROJECT_ROOT, 'data', 'processed_json', 'myfriends'];

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
