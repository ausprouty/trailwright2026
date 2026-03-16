export function interpolate(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(
    /\{(\w+)\}/g,
    (match: string, key: string): string => {
      return Object.prototype.hasOwnProperty.call(values, key)
        ? String(values[key])
        : match;
    }
  );
}