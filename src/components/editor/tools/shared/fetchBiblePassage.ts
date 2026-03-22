import axios from 'axios';

import { http } from 'src/lib/http';

export type BibleToolConfig = {
  endpointPath?: string;
  languageCodeGoogle?: string;
};

export async function fetchBiblePassage(
  reference: string,
  config: BibleToolConfig,
): Promise<string> {
  const endpointPath = config.endpointPath ?? '/v2/bible/passage';
  const languageCodeGoogle = config.languageCodeGoogle ?? 'en';

  const payload = {
    entry: reference,
    languageCodeGoogle,
  };

  try {
    console.log('fetchBiblePassage reference', reference);
    console.log('fetchBiblePassage config', config);
    console.log('fetchBiblePassage endpointPath', endpointPath);
    console.log('fetchBiblePassage languageCodeGoogle', languageCodeGoogle);
    console.log('fetchBiblePassage payload', payload);
    console.log('fetchBiblePassage using http baseURL', http.defaults.baseURL);
    const res = await http.post(endpointPath, payload);
    const data: unknown = res && res.data ? res.data : res;

    return extractPassageFromJson(data).trim();
  } catch (error: unknown) {
    if (!navigator.onLine) {
      throw new Error('You appear to be offline.');
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      if (status && status >= 500) {
        throw new Error('The Bible service is temporarily unavailable.');
      }

      if (status && status >= 400) {
        throw new Error('Could not load passage. Check the reference and try again.');
      }
    }

    throw new Error('Could not contact the Bible service.');
  }
}

export function extractPassageFromJson(json: unknown): string {
  if (!json) {
    return '';
  }

  if (typeof json === 'string') {
    return json;
  }

  if (typeof json === 'object' && json !== null) {
    const obj = json as Record<string, unknown>;

    const passage = obj['passage'];
    if (typeof passage === 'string') {
      return passage;
    }

    const text = obj['text'];
    if (typeof text === 'string') {
      return text;
    }

    const content = obj['content'];
    if (typeof content === 'string') {
      return content;
    }

    const verses = obj['verses'];
    if (Array.isArray(verses)) {
      const lines: string[] = [];

      for (const v of verses) {
        if (typeof v === 'string') {
          lines.push(v);
          continue;
        }

        if (typeof v === 'object' && v !== null) {
          const verseObj = v as Record<string, unknown>;
          const vt = verseObj['text'];
          const vn = verseObj['verse'];

          if (typeof vt === 'string') {
            if (typeof vn === 'string' || typeof vn === 'number') {
              lines.push(`${vn}. ${vt}`);
            } else {
              lines.push(vt);
            }
          }
        }
      }

      return lines.filter(Boolean).join('\n');
    }

    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return '';
    }
  }

  return '';
}
