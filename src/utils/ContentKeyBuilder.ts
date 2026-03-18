import { normId, normIntish } from 'src/utils/normalize';

function nId(value: string): string | null {
  const normalized = normId(value);
  return normalized ? normalized : null;
}

function nInt(value: number | string | undefined): string | null {
  const normalized = normIntish(value);
  return normalized ? normalized : null;
}

export function buildIWillKey(
  study: string,
  lesson: number,
  position: number | string | undefined,
): string | null {
  const s = nId(study);
  const l = nInt(lesson);
  const p = nInt(position);

  if (!s || !l) {
    return null;
  }

  return 'iwill-' + s + '-lesson-' + l + '-' + (p || '0');
}

export function buildLessonContentKey(
  study: string,
  languageCodeHL: string,
  languageCodeJF: string,
  lesson: number,
): string | null {
  const s = nId(study);
  const hl = nId(languageCodeHL);
  const jf = nInt(languageCodeJF);
  const l = nInt(lesson);

  if (!s || !hl || !jf || !l) {
    return null;
  }

  return 'lessonContent-' + s + '-' + hl + '-' + jf + '-lesson-' + l;
}

export function buildNotesKey(
  study: string,
  lesson: number,
  position: number | string | undefined,
): string | null {
  const s = nId(study);
  const l = nInt(lesson);

  if (!s || !l) {
    return null;
  }

  const p = nInt(position);
  const pos = p || '0';

  return 'notes-' + s + '-' + l + '-' + pos;
}

export function buildStudyProgressKey(study: string): string | null {
  const s = nId(study);
  return s ? 'progress-' + s : null;
}
