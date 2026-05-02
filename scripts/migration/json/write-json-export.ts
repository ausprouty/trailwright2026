#! npx tsx scripts/migration/json/write-json-export.ts data/sql_exports/myfriends/json_content.json

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
