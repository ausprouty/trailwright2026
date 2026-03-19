import axios from 'axios';
import { http } from 'src/lib/http';

export type TemplateListItem = {
  key: string;
  label: string;
};

type EditorBlockData = {
  id?: string;
  type: string;
  data: Record<string, unknown>;
};

export type TemplateContent = {
  time?: number;
  version?: string;
  blocks: EditorBlockData[];
};

type TemplateListResponse = {
  language?: string;
  templates?: TemplateListItem[];
  error?: string;
};

type TemplateContentResponse = {
  language?: string;
  template?: string;
  content?: TemplateContent;
  error?: string;
};

function assertLang(lang: string): string {
  const value = lang.trim();

  if (!value) {
    throw new Error('Template service: lang is required.');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    throw new Error(`Template service: invalid lang "${lang}".`);
  }

  return value;
}

function assertTemplateKey(template: string): string {
  const value = template.trim();

  if (!value) {
    throw new Error('Template service: template is required.');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    throw new Error(`Template service: invalid template "${template}".`);
  }

  return value;
}

function normalizeTemplateContent(content: TemplateContent): TemplateContent {
  const normalized: TemplateContent = {
    blocks: Array.isArray(content.blocks) ? content.blocks : [],
  };

  if (typeof content.time === 'number') {
    normalized.time = content.time;
  }

  if (typeof content.version === 'string') {
    normalized.version = content.version;
  }

  return normalized;
}

export async function fetchTemplateList(lang: string): Promise<TemplateListItem[]> {
  const safeLang = assertLang(lang);

  try {
    const response = await http.get<TemplateListResponse>('/templates/list.php', {
      params: { lang: safeLang },
    });

    if (!response.data) {
      throw new Error('Template list API returned no data.');
    }

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    if (!Array.isArray(response.data.templates)) {
      return [];
    }

    return response.data.templates
      .filter((item) => {
        return Boolean(item && typeof item.key === 'string' && typeof item.label === 'string');
      })
      .map((item) => ({
        key: item.key.trim(),
        label: item.label.trim(),
      }));
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const message =
        typeof error.response?.data?.error === 'string' ? error.response.data.error : error.message;

      throw new Error(`Could not load template list for "${safeLang}": ${message}`);
    }

    throw error;
  }
}

export async function fetchTemplateContent(
  lang: string,
  template: string,
): Promise<TemplateContent> {
  const safeLang = assertLang(lang);
  const safeTemplate = assertTemplateKey(template);

  try {
    const response = await http.get<TemplateContentResponse>('/templates/get.php', {
      params: {
        lang: safeLang,
        template: safeTemplate,
      },
    });

    if (!response.data) {
      throw new Error('Template content API returned no data.');
    }

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    if (!response.data.content) {
      throw new Error('Template content missing from API response.');
    }

    return normalizeTemplateContent(response.data.content);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const message =
        typeof error.response?.data?.error === 'string' ? error.response.data.error : error.message;

      throw new Error(`Could not load template "${safeTemplate}" for "${safeLang}": ${message}`);
    }

    throw error;
  }
}
