## Day 1

- Decided to start with English files
- Will begin with "life principles" series
- Plan: build single-file converter first

## Day 2

- Can render 'life principles' series
- Plan: add notes area for each section.
  normalizeLessonBlocks.ts

Responsibility:

inspect migrated blocks
ensure notes areas exist in the right places
fill prompts when blank
ensure final iWill block exists
remain idempotent

## Day 3

In the basics, we do NOT add an I will to the end of the lesson. Instead we replace the first notes in Look Forward with an I will statement

## Day 4

WE need to fix: AU/eng/basics/community

## Day 5

English is fixed; now working on German

## Day 6

first npm run dev

npx tsx scripts/migration/basics/migrate-basics-test.ts

Wording on:
const COUNTRY = 'FI';
const LANGUAGE = 'fin';
const SERIES = 'basics';

still getting note before first sectiion

## Day 7

Spanish Basics is missing 1-6
Amharic Basics is missing 1-6

## Day 8

Restored missing Files (they did not have html as file type)
Start again with AU cmn done
