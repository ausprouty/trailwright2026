// src/utils/content/remapImagePaths.ts

export function remapImagePaths(html: string): string {
  return html.replace(/(["'=])\/images\/gospel\//g, '$1/sites/myfriends/images/gospel/');
}
