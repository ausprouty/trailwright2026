export function trimNbspEdges(text: string): string {
  return text
    .replace(/^(?:\s|&nbsp;|\u00A0)+/gi, '')
    .replace(/(?:\s|&nbsp;|\u00A0)+$/gi, '');
}
