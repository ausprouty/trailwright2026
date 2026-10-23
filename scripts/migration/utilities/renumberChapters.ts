
/**
 * RENUMBER CHAPTER IDS
 *
 * PURPOSE
 * -------
 * Renumbers chapter IDs in a JSON index file so that they are
 * sequential integers starting at 0.
 *
 * The script reads the chapters array and assigns each chapter
 * an ID corresponding to its position in that array.
 *
 * This ensures that the frontend can identify and link to
 * individual chapters using consistent chapter IDs.
 *
 * USAGE
 * -----
 * Run from the project root:
 *     CHECK OUTPUT FOLDER
 *
 *   npx tsx scripts/migration/renumberChapters.ts <input> [output]
 *
 * Example (modify the original file):
 *
 *   npx tsx scripts/migration/renumberChapters.ts public/content/myfriends/AU/eng/multiply1/index.json
 *
 * Example (write to a different file):
 *
 *   npx tsx scripts/migration/renumberChapters.ts public/content/myfriends/AU/eng/multiply1/index.json output.json
 *
 * INPUT
 * -----
 * A single JSON file containing a chapters array.
 *
 * Example:
 *
 * {
 *   "description": "Multiply 1",
 *   "chapters": [
 *     { "id": null, "title": "Introduction", "filename": "intro.json" },
 *     { "id": 5, "title": "Lesson 1", "filename": "lesson1.json" },
 *     { "id": 9, "title": "Lesson 2", "filename": "lesson2.json" }
 *   ]
 * }
 *
 * OUTPUT
 * ------
 * The same JSON structure, with chapter IDs renumbered
 * sequentially starting at 0.
 *
 * {
 *   "description": "Multiply 1",
 *   "chapters": [
 *     { "id": 0, "title": "Introduction", "filename": "intro.json" },
 *     { "id": 1, "title": "Lesson 1", "filename": "lesson1.json" },
 *     { "id": 2, "title": "Lesson 2", "filename": "lesson2.json" }
 *   ]
 * }
 *
 * BEHAVIOUR
 * ---------
 * - Processes one JSON file per execution.
 * - Requires a top-level chapters array.
 * - Assigns IDs 0, 1, 2, etc., based on array position.
 * - Replaces existing chapter IDs, including valid IDs.
 * - Preserves the order of chapters.
 * - Preserves other properties, including titles and filenames.
 * - Preserves other top-level JSON properties.
 * - Formats the output with 2-space indentation.
 * - Overwrites the input file unless an output path is provided.
 * - Reports the number of chapters renumbered.
 * - Throws an error if the chapters array is missing.
 *
 * LIMITATIONS
 * -----------
 * - Does not process directories or subdirectories.
 * - Does not support a --dry-run option.
 * - Does not check whether renumbering is necessary.
 * - Does not create missing output directories.
 * - Does not modify the individual lesson JSON files.
 * - Does not update references to chapter IDs elsewhere.
 *
 * IMPORTANT
 * ---------
 * Chapter IDs are determined solely by array position.
 *
 * If the chapter order changes, running this script again
 * will assign new IDs based on that new order.
 *
 * This script modifies chapter index files, not lesson content.
 */
