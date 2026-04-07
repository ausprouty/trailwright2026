import axios from 'axios';

import { http } from 'src/lib/http';

export type BibleToolConfig = {
  endpointPath?: string;
  languageCodeGoogle?: string;
};

export type BiblePassageResult = {
  reference: string;
  html: string;
  url: string;
};

export async function fetchBiblePassage(
  reference: string,
  config: BibleToolConfig,
): Promise<BiblePassageResult> {
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

    return extractPassageFromJson(data, reference);
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

export function extractPassageFromJson(json: unknown, fallbackReference = ''): BiblePassageResult {
  const empty: BiblePassageResult = {
    reference: fallbackReference,
    html: '',
    url: '',
  };

  if (!json || typeof json !== 'object') {
    return empty;
  }

  const obj = json as Record<string, unknown>;

  const result: BiblePassageResult = {
    reference: typeof obj.reference === 'string' ? obj.reference : fallbackReference,

    html:
      typeof obj.html === 'string'
        ? obj.html
        : typeof obj.passage === 'string'
          ? obj.passage
          : typeof obj.text === 'string'
            ? obj.text
            : typeof obj.content === 'string'
              ? obj.content
              : '',

    url: typeof obj.url === 'string' ? obj.url : typeof obj.link === 'string' ? obj.link : '',
  };

  return result;
}
