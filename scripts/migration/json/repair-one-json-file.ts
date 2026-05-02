#! npx tsx scripts/migration/json/repair-one-json-file.ts data/processed_json/myfriends/IN/hin/life/index.json

// This script is for repairing mojibake in a single JSON file.
// It reads the file, repairs any mojibake it finds,
// and writes the repaired JSON to a new file with ".repaired" added to the filename.

import fs from 'node:fs/promises';
import path from 'node:path';

const inputFile = process.argv[2];

if (!inputFile) {
  console.error('Usage: npx tsx repair-one-json-file.ts <file>');
  process.exit(1);
}

function repairMojibake(value: string): string {
  if (
    !value.includes('Ã') &&
    !value.includes('ï') &&
    !value.includes('Û') &&
    !value.includes('Ù')
  ) {
    return value;
  }

  let repaired = value;

  for (let i = 0; i < 2; i += 1) {
    repaired = Buffer.from(repaired, 'latin1').toString('utf8');
  }

  return repaired;
}

function deepRepair(value: unknown): unknown {
  if (typeof value === 'string') {
    return repairMojibake(value);
  }

  if (Array.isArray(value)) {
    return value.map(deepRepair);
  }

  if (value && typeof value === 'object') {
    const repairedObject: Record<string, unknown> = {};

    for (const [key, childValue] of Object.entries(value)) {
      repairedObject[key] = deepRepair(childValue);
    }

    return repairedObject;
  }

  return value;
}

async function main(): Promise<void> {
  if (!inputFile) {
    console.error('Usage: npx tsx repair-one-json-file.ts <file>');
    process.exit(1);
  }
  const absoluteInputPath = path.resolve(inputFile);
  const originalText = await fs.readFile(absoluteInputPath, 'utf8');

  const json = JSON.parse(originalText);
  const repairedJson = deepRepair(json);

  const parsedPath = path.parse(absoluteInputPath);
  const outputPath = path.join(parsedPath.dir, `${parsedPath.name}.repaired${parsedPath.ext}`);

  await fs.writeFile(outputPath, `${JSON.stringify(repairedJson, null, 2)}\n`, 'utf8');

  console.log(`Repaired file written to: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
