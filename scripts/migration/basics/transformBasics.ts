import { migrateOldLessonHtmlToEditorJs } from './migrateOldLessonHtml';
import { normalizeLessonBlocks } from './normalizeLessonBlocks';

export type TransformContext = {
  country: string;
  language: string;
  series: string;
  sourceFile: string;
};

export function transformBasics(html: string, context: TransformContext) {
  const json = migrateOldLessonHtmlToEditorJs(html, {
    includeTime: true,
    includeVersion: true,
  });

  const baseName = context.sourceFile.replace(/\.html$/i, '');
  const keyPrefix = `${context.series}-${baseName}`;

  json.blocks = normalizeLessonBlocks(json.blocks, {
    keyPrefix,
  });

  return json;
}
