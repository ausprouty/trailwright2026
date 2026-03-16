import axios from 'axios';

export type TemplateListItem = {
  key: string;
  label: string;
};

type TemplateListResponse = {
  language: string;
  templates: TemplateListItem[];
};

type TemplateContentResponse = {
  language: string;
  template: string;
  content: {
    time?: number;
    version?: string;
    blocks: Array<{
      id?: string;
      type: string;
      data: Record<string, unknown>;
    }>;
  };
};

const API_BASE = '/trailwright/public/api/templates';

export async function fetchTemplateList(lang: string): Promise<TemplateListItem[]> {
  const response = await axios.get<TemplateListResponse>(`${API_BASE}/list.php`, {
    params: { lang },
  });

  return response.data.templates;
}

export async function fetchTemplateContent(
  lang: string,
  template: string,
): Promise<TemplateContentResponse['content']> {
  const response = await axios.get<TemplateContentResponse>(`${API_BASE}/get.php`, {
    params: {
      lang,
      template,
    },
  });

  return response.data.content;
}
