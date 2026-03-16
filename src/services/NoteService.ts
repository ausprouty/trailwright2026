export async function getNote(
  study: string,
  lesson: number,
  noteType: string,
): Promise<string | null> {
  console.log('[NoteService] getNote', {
    study,
    lesson,
    noteType,
  });

  return Promise.resolve(null);
}
