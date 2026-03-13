export function getNote(study: string, lesson: number, noteType: string): Promise<string> {
  console.log('[NoteService] getNote', {
    study,
    lesson,
    noteType,
  });

  return '';
}
