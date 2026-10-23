// src/utils/content/remapImagePaths.ts

export function remapMc2ImagePaths(html: string): string {
  return html.replace(/(["'=])\/images\/gospel\//g, '$1/sites/mc2/images/gospel/');
}
