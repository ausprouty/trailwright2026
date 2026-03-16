import type {
  LessonTemplateIndexItem,
  LessonTemplateFile,
} from "./types";

export const templates: LessonTemplateIndexItem[] = [
  {
    key: "multiply1",
    label: "Multiply 1",
    language: "en",
    path: "/templates/en/multiply1.json",
  },
  {
    key: "multiply2",
    label: "Multiply 2",
    language: "en",
    path: "/templates/en/multiply2.json",
  },
  {
    key: "multiply3",
    label: "Multiply 3",
    language: "en",
    path: "/templates/en/multiply3.json",
  },
  {
    key: "multiply1",
    label: "Multiplicar 1",
    language: "es",
    path: "/templates/es/multiply1.json",
  },
  {
    key: "multiply2",
    label: "Multiplicar 2",
    language: "es",
    path: "/templates/es/multiply2.json",
  },
  {
    key: "multiply3",
    label: "Multiplicar 3",
    language: "es",
    path: "/templates/es/multiply3.json",
  },
];

export function getTemplatesByLanguage(
  language: string,
): LessonTemplateIndexItem[] {
  return templates.filter((template) => template.language === language);
}

export function getTemplateIndexItem(
  key: string,
  language: string,
): LessonTemplateIndexItem | undefined {
  return templates.find(
    (template) =>
      template.key === key &&
      template.language === language,
  );
}

export async function loadTemplateFile(
  key: string,
  language: string,
): Promise<LessonTemplateFile | undefined> {
  const item = getTemplateIndexItem(key, language);

  if (!item) {
    return undefined;
  }

  const response = await fetch(item.path);

  if (!response.ok) {
    throw new Error(
      `Could not load template: ${item.language}/${item.key}`,
    );
  }

  return (await response.json()) as LessonTemplateFile;
}