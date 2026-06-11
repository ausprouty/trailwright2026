import { migrateOldLessonHtmlToEditorJs } from './migrateOldLessonHtml';
import { normalizeLessonBlocks } from './normalizeLessonBlocks';
import { createLessonJson } from '../createLessonJson';
import type { MyFriendsCountry } from '../createLessonJson';

export type TransformContext = {
  site: string;
  country: MyFriendsCountry;
  language: string;
  series: string;
  lessonId: string;
  sourceFile: string;
  sortOrder: number;
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

  return createLessonJson({
    country: context.country,
    language: context.language,
    series: context.series,
    lessonId: context.lessonId,
    sortOrder: context.sortOrder,
    blocks: json.blocks,
  });
}
