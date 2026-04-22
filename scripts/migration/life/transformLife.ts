import { migrateOldLessonHtmlToEditorJs } from './migrateOldLessonHtml';
import { normalizeLessonBlocks } from './normalizeLessonBlocks';

export type TransformContext = {
  country: string;
  language: string;
  series: string;
  sourceFile: string;
};

export function transformLife(html: string, context: TransformContext) {
  // Step 1: convert HTML → EditorJS structure
  const json = migrateOldLessonHtmlToEditorJs(html, {
    includeTime: true,
    includeVersion: true,
  });

  // Step 2: derive lesson code (life101 → 101)
  const lessonCode = context.sourceFile.replace(/\.html$/i, '').replace(/^life/i, '');

  const keyPrefix = `${context.series}-${lessonCode}`;

  // Step 3: normalize blocks (notes keys, cleanup, etc.)
  json.blocks = normalizeLessonBlocks(json.blocks, {
    keyPrefix,
  });

  return json;
}
