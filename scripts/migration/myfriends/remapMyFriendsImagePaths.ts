// src/utils/content/remapMyFriendsImagePaths.ts

export function remapMyFriendsImagePaths(html: string): string {
  return html.replace(/(["'=])\/images\/gospel\//g, '$1/sites/myfriends/images/gospel/');
}
