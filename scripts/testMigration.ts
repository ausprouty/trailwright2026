import { readFileSync } from 'node:fs';
import { migrateOldLessonHtmlToEditorJs } from './migrateOldLessonHtml';

const html = readFileSync('./sample-lesson.html', 'utf8');

const result = migrateOldLessonHtmlToEditorJs(html, {
  includeTime: true,
  includeVersion: true,
});

console.log(JSON.stringify(result, null, 2));
