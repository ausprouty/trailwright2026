import { normId, normIntish } from 'src/utils/normalize';

function nId(value: string): string | null {
  const normalized = normId(value);
  return normalized ? normalized : null;
}

function nInt(value: number | string): string | null {
  const normalized = normIntish(value);
  return normalized ? normalized : null;
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

export function buildNotesKey(study: string, lesson: number, position: string): string | null {
  const s = nId(study);
  const l = nInt(lesson);
  const p = nId(position);

  if (!s || !l || !p) {
    return null;
  }

  return 'notes-' + s + '-' + l + '-' + p;
}

export function buildIWillKey(study: string, lesson: number, sequence = 1): string | null {
  const s = nId(study);
  const l = nInt(lesson);
  const seq = nInt(sequence);

  if (!s || !l || !seq) {
    return null;
  }

  return 'iwill-' + s + '-lesson-' + l + '-seq-' + seq;
}

export function buildStudyProgressKey(study: string): string | null {
  const s = nId(study);
  return s ? 'progress-' + s : null;
}
