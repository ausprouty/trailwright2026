import EditorJS, { type OutputData } from "@editorjs/editorjs";

import { createEditorTools } from "./createEditorTools";
import type { LanguageCode } from "../i18n";

type CreateEditorOptions = {
  data?: OutputData;
  holder: string;
  lang: LanguageCode;
};

export function createEditor({
  holder,
  data,
  lang,
}: CreateEditorOptions) {
  return new EditorJS({
    holder,
    data,
    tools: createEditorTools(lang),
  });
}