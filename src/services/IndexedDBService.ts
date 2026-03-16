export function getStudyProgress(study: string): Promise<{ lastCompletedLesson?: number } | null> {
  console.log('[IndexedDBService] getStudyProgress', {
    study,
  });

  return Promise.resolve(null);
}
