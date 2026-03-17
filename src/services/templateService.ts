import axios from 'axios';

export type TemplateListItem = {
  key: string;
  label: string;
};

type TemplateListResponse = {
  language?: string;
  templates?: TemplateListItem[];
  error?: string;
};

type TemplateContentResponse = {
  language?: string;
  template?: string;
  content?: {
    time?: number;
    version?: string;
    blocks: Array<{
      id?: string;
      type: string;
      data: Record<string, unknown>;
    }>;
  };
  error?: string;
};

const API_BASE = 'http://localhost/trailwright/public/api/templates';

export async function fetchTemplateList(lang: string): Promise<TemplateListItem[]> {
  const response = await axios.get<TemplateListResponse>(`${API_BASE}/list.php`, {
    params: { lang },
  });

  if (!response.data) {
    throw new Error('Template list API returned no data');
  }

  if (response.data.error) {
    throw new Error(response.data.error);
  }

  if (!Array.isArray(response.data.templates)) {
    console.error('Unexpected template list response', response.data);
    return [];
  }

  return response.data.templates;
}

export async function fetchTemplateContent(
  lang: string,
  template: string,
): Promise<{
  time?: number;
  version?: string;
  blocks: Array<{
    id?: string;
    type: string;
    data: Record<string, unknown>;
  }>;
}> {
  const response = await axios.get<TemplateContentResponse>(`${API_BASE}/get.php`, {
    params: {
      lang,
      template,
    },
  });

  if (!response.data) {
    throw new Error('Template content API returned no data');
  }

  if (response.data.error) {
    throw new Error(response.data.error);
  }

  if (!response.data.content) {
    throw new Error('Template content missing from API response');
  }

  return response.data.content;
}
