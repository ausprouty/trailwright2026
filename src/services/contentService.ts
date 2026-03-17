import { http } from 'src/lib/http';

type OutputData = {
  blocks: Array<{
    id?: string;
    type: string;
    data: Record<string, unknown>;
  }>;
  time?: number;
  version?: string;
};

type ContentListItem = {
  fileName: string;
  label: string;
};

async function saveContent(lang: string, fileName: string, content: OutputData): Promise<void> {
  await http.post('/content/save', {
    lang,
    fileName,
    content,
  });
}

async function listContent(lang: string): Promise<ContentListItem[]> {
  const response = await http.get('/content/list', {
    params: { lang },
  });

  return response.data.items as ContentListItem[];
}

async function getContent(lang: string, fileName: string): Promise<OutputData | null> {
  const response = await http.get('/content/get', {
    params: { lang, fileName },
  });

  return response.data.content as OutputData;
}

export default {
  saveContent,
  listContent,
  getContent,
};
