//npx tsx scripts/migrationrenumberChapters.ts public/content/myfriends/AU/eng/multiply1/index.json
// went through json files and made sure all chapters have an id,
// and that the ids are sequential starting from 0.
// This is needed for the frontend to be able to
// link to specific chapters by id.
// The script can be run on a single file,
// or on all json files in a directory (and its subdirectories)
// if a directory path is provided.
// If the --dry-run flag is provided, the script will only log
// the changes that would be made, without actually writing to any files.
import fs from 'node:fs/promises';
import path from 'node:path';

type Chapter = {
  id: number | null;
  title?: string;
  filename?: string;
  [key: string]: unknown;
};

type ChapterFile = {
  description?: string;
  chapters: Chapter[];
  [key: string]: unknown;
};

async function renumberChapters(inputPath: string, outputPath?: string): Promise<void> {
  const raw = await fs.readFile(inputPath, 'utf8');
  const data = JSON.parse(raw) as ChapterFile;

  if (!Array.isArray(data.chapters)) {
    throw new Error(`No chapters array found in ${inputPath}`);
  }

  data.chapters = data.chapters.map((chapter, index) => ({
    ...chapter,
    id: index,
  }));

  const finalOutputPath = outputPath ?? inputPath;

  await fs.writeFile(finalOutputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

  console.log(`Renumbered ${data.chapters.length} chapters`);
  console.log(`Saved to ${finalOutputPath}`);
}

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath) {
  console.error('Usage: tsx scripts/renumberChapters.ts path/to/file.json [path/to/output.json]');
  process.exit(1);
}

renumberChapters(path.resolve(inputPath), outputPath ? path.resolve(outputPath) : undefined).catch(
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
