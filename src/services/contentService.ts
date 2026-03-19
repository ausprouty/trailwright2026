import axios from 'axios';
import { http } from 'src/lib/http';

type EditorBlockData = {
  id?: string;
  type: string;
  data: Record<string, unknown>;
};

export type OutputData = {
  blocks: EditorBlockData[];
  time?: number;
  version?: string;
};

export type ContentListItem = {
  fileName: string;
  label: string;
};

type ContentListResponse = {
  items?: ContentListItem[];
};

type ContentGetResponse = {
  content?: OutputData | null;
};

type ContentSaveResponse = {
  success?: boolean;
  error?: string;
};

function assertLang(lang: string): string {
  const value = lang.trim();

  if (!value) {
    throw new Error('Content service: lang is required.');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    throw new Error(`Content service: invalid lang "${lang}".`);
  }

  return value;
}

function assertFileName(fileName: string): string {
  const value = fileName.trim();

  if (!value) {
    throw new Error('Content service: fileName is required.');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    throw new Error(`Content service: invalid fileName "${fileName}".`);
  }

  return value;
}

function normalizeOutputData(content: OutputData): OutputData {
  const normalized: OutputData = {
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

async function saveContent(lang: string, fileName: string, content: OutputData): Promise<void> {
  const safeLang = assertLang(lang);
  const safeFileName = assertFileName(fileName);
  const safeContent = normalizeOutputData(content);

  const response = await http.post<ContentSaveResponse>('/content/save.php', {
    lang: safeLang,
    fileName: safeFileName,
    content: safeContent,
  });

  const data = response.data;

  if (data && data.error) {
    throw new Error(`Could not save content: ${data.error}`);
  }
}

async function listContent(lang: string): Promise<ContentListItem[]> {
  const safeLang = assertLang(lang);

  const response = await http.get<ContentListResponse>('/content/list.php', {
    params: { lang: safeLang },
  });

  const items = response.data?.items;

  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => {
      return Boolean(item && typeof item.fileName === 'string' && typeof item.label === 'string');
    })
    .map((item) => ({
      fileName: item.fileName.trim(),
      label: item.label.trim(),
    }));
}

async function getContent(lang: string, fileName: string): Promise<OutputData | null> {
  const safeLang = assertLang(lang);
  const safeFileName = assertFileName(fileName);

  try {
    const response = await http.get<ContentGetResponse>('/content/get.php', {
      params: {
        lang: safeLang,
        fileName: safeFileName,
      },
    });

    const content = response.data?.content;

    if (!content || typeof content !== 'object') {
      return null;
    }

    return normalizeOutputData(content);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return null;
      }

      const message =
        typeof error.response?.data?.error === 'string' ? error.response.data.error : error.message;

      throw new Error(`Could not load content "${safeFileName}": ${message}`);
    }

    throw error;
  }
}

export default {
  saveContent,
  listContent,
  getContent,
};
