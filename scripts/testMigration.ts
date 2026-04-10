import { readFileSync } from 'node:fs';
import { migrateOldLessonHtmlToEditorJs } from './migrateOldLessonHtml';

//const html = readFileSync('./previous/life102.html', 'utf8');
//const html = readFileSync('./previous/basics107.html', 'utf8');
//const html = readFileSync('./previous/basics108.html', 'utf8');
const html = readFileSync('./previous/basics102.html', 'utf8');

const result = migrateOldLessonHtmlToEditorJs(html, {
  includeTime: true,
  includeVersion: true,
});

console.log(JSON.stringify(result, null, 2));
