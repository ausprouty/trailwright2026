// npx tsx scripts/migration/renumberProcessedJsonChapters.ts --dry-run

import fs from 'node:fs/promises';
import path from 'node:path';

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
  chapters?: Chapter[];
};

const ROOT_DIR = path.resolve('data/processed_json');

type Options = {
  dryRun: boolean;
};

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function getJsonFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await getJsonFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }

  return files;
}

function isChapterJson(data: unknown): data is ChapterJson {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const maybe = data as ChapterJson;

  return Array.isArray(maybe.chapters);
}

function renumberChapters(data: ChapterJson): {
  changed: boolean;
  count: number;
} {
  if (!data.chapters) {
    return {
      changed: false,
      count: 0,
    };
  }

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

async function processJsonFile(filePath: string, options: Options): Promise<void> {
  const raw = await fs.readFile(filePath, 'utf8');

  let data: unknown;

  try {
    data = JSON.parse(raw);
  } catch {
    console.warn(`Skipping invalid JSON: ${filePath}`);
    return;
  }

  if (!isChapterJson(data)) {
    return;
  }

  const { changed, count } = renumberChapters(data);

  if (!changed) {
    console.log(`OK      ${path.relative(ROOT_DIR, filePath)} (${count} chapters)`);
    return;
  }

  if (options.dryRun) {
    console.log(`WOULD   ${path.relative(ROOT_DIR, filePath)} (${count} chapters)`);
    return;
  }

  const output = `${JSON.stringify(data, null, 2)}\n`;

  await fs.writeFile(filePath, output, 'utf8');

  console.log(`FIXED   ${path.relative(ROOT_DIR, filePath)} (${count} chapters)`);
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  if (!(await fileExists(ROOT_DIR))) {
    throw new Error(`Directory not found: ${ROOT_DIR}`);
  }

  const jsonFiles = await getJsonFiles(ROOT_DIR);

  console.log(`Scanning ${jsonFiles.length} JSON files in ${ROOT_DIR}`);
  console.log(dryRun ? 'Mode: dry run' : 'Mode: write changes');
  console.log('');

  for (const filePath of jsonFiles) {
    await processJsonFile(filePath, { dryRun });
  }

  console.log('');
  console.log('Done.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
