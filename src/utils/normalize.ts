import { unref, type Ref } from 'vue';

type MaybeRef<T> = T | Ref<T>;

type KeyableObject = Record<string, unknown>;

export function pickFirst<T>(value: MaybeRef<T | T[]>): T | undefined {
  const resolved = unref(value);

  if (Array.isArray(resolved)) {
    return resolved[0];
  }

  return resolved;
}
function toCleanString(value: unknown): string {
  if (value == null) {
    return '';
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value).trim();
  }

  return '';
}

export function normId(value: unknown): string {
  const text = toCleanString(pickFirst(value));

  return text.toLowerCase() === 'undefined' ? '' : text;
}

export function normIntish(value: unknown): string {
  const text = normId(value);

  if (!text) {
    return '';
  }

  const num = Number(text);

  return Number.isFinite(num) ? String(num) : text;
}

export function normPositiveInt(value: unknown): number | undefined {
  const text = normId(value);

  if (!/^\d+$/.test(text)) {
    return undefined;
  }

  const num = Number(text);

  return num > 0 ? num : undefined;
}

export function normParamStr(value: unknown): string {
  const text = normId(value);

  if (!text) {
    return '';
  }

  if (text.toLowerCase() === 'null') {
    return '';
  }

  return text;
}

export function assertRequired(obj: unknown, keys: string[], where = 'function'): void {
  const resolved = (unref(obj) || {}) as KeyableObject;

  const missing = keys.filter((key) => !normId(resolved[key]));

  if (missing.length > 0) {
    throw new Error(`Missing required: ${missing.join(', ')} in ${where}`);
  }
}

export function fromObjId(
  value: unknown,
  keys: string[] = ['slug', 'code', 'id', 'key', 'name', 'title'],
): unknown {
  const resolved = unref(value);

  if (resolved && typeof resolved === 'object' && !Array.isArray(resolved)) {
    const obj = resolved as KeyableObject;

    for (const key of keys) {
      const candidate = obj[key];

      if (candidate !== undefined && candidate !== null && toCleanString(candidate) !== '') {
        return candidate;
      }
    }

    return '';
  }

  return resolved;
}

export function normPathSeg(value: unknown): string {
  return encodeURIComponent(normId(fromObjId(value)));
}

export function normKey(value: unknown): string {
  return normId(fromObjId(value))
    .replace(/[\s_-]+/g, '')
    .toLowerCase();
}

export function isObj(value: unknown): value is Record<string, unknown> {
  const resolved = unref(value);

  return !!resolved && typeof resolved === 'object' && !Array.isArray(resolved);
}

export function safeObj(value: unknown): Record<string, unknown> {
  const resolved = unref(value);

  return resolved && typeof resolved === 'object' && !Array.isArray(resolved)
    ? (resolved as Record<string, unknown>)
    : {};
}

export function safeKeys(value: unknown): string[] {
  const resolved = unref(value);

  return resolved && typeof resolved === 'object' && !Array.isArray(resolved)
    ? Object.keys(resolved as Record<string, unknown>)
    : [];
}

export function withBase(base: unknown, path = ''): string {
  const baseValue = unref(base);
  const pathValue = unref(path);

  const baseText = toCleanString(baseValue) || '/';

  const pathText = toCleanString(pathValue) || '';

  return baseText.replace(/\/+$/, '/') + pathText.replace(/^\/+/, '');
}

export function normBoolish(value: unknown, def = false): boolean {
  const text = normId(value);

  if (!text) {
    return def;
  }

  if (/^(true|1|yes|y|on)$/i.test(text)) {
    return true;
  }

  if (/^(false|0|no|n|off)$/i.test(text)) {
    return false;
  }

  return def;
}

export function isHLCode(value: unknown): boolean {
  const text = normParamStr(value);
  return /^[A-Za-z]{3}\d{2}$/.test(text);
}

export function normHL(value: unknown): string {
  const text = normParamStr(value);
  return isHLCode(text) ? text : '';
}

export function normJF(value: unknown): string {
  const text = normParamStr(value);
  return /^\d+$/.test(text) ? text : '';
}

export function normVariant(value: unknown): string {
  let text = normId(value);

  if (!text || text === 'null' || text === 'undefined') {
    return 'default';
  }

  text = String(text)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');

  return text && text.length ? text : 'default';
}

export function normStudyKey(value: unknown): string {
  const text = normId(value);

  return text ? text.toLowerCase().replace(/[^a-z0-9-]/g, '') : '';
}

export function normBibleRef(value: unknown): string {
  let text = toCleanString(pickFirst(value));

  if (!text) {
    return '';
  }

  text = text.replace(/\s+/g, ' ');
  text = text.replace(/(\d)\s*-\s*(\d)/g, '$1–$2');
  text = text.replace(/\s*:\s*/g, ':');
  text = text.replace(/:\s+/g, ':');
  text = text.replace(/\s+:/g, ':');
  text = text.replace(/\s*,\s*/g, ', ');
  text = text.replace(/\s*;\s*/g, '; ');

  return text.trim();
}
