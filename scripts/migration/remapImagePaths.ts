// src/utils/content/remapImagePaths.ts

export function remapImagePaths(html: string): string {
  return html.replaceAll('/images/gospel/', '/sites/myfriends/images/gospel/');
}
