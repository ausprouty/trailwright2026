export const HEADER_BLOCK_TYPE = 'header';

export const HEADER_LEVEL_MIN = 1;
export const HEADER_LEVEL_MAX = 6;
export const HEADER_LEVEL_DEFAULT = 2;

export type HeaderLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type HeaderBlockData = {
  text: string;
  level: HeaderLevel;
};

type HeaderBlockCandidate = {
  text?: unknown;
  level?: unknown;
};

function isHeaderLevel(value: unknown): value is HeaderLevel {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= HEADER_LEVEL_MIN &&
    value <= HEADER_LEVEL_MAX
  );
}

export function clampHeaderLevel(value: unknown): HeaderLevel {
  if (isHeaderLevel(value)) {
    return value;
  }

  return HEADER_LEVEL_DEFAULT;
}

export function makeEmptyHeaderBlockData(): HeaderBlockData {
  return {
    text: '',
    level: HEADER_LEVEL_DEFAULT,
  };
}

export function normalizeHeaderBlockData(value: unknown): HeaderBlockData {
  if (!value || typeof value !== 'object') {
    return makeEmptyHeaderBlockData();
  }

  const candidate = value as HeaderBlockCandidate;

  return {
    text: typeof candidate.text === 'string' ? candidate.text : '',
    level: clampHeaderLevel(candidate.level),
  };
}

export function hasHeaderText(data: HeaderBlockData): boolean {
  return data.text.trim().length > 0;
}
