import type { OutputData } from "@editorjs/editorjs";

export interface LessonTemplateIndexItem {
  key: string;
  label: string;
  language: string;
  path: string;
}

export interface LessonTemplateFile {
  key: string;
  label: string;
  blocks: OutputData["blocks"];
}