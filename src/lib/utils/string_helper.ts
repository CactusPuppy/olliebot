export function toSlug(string: string): string {
  return string.toLowerCase().replace(/ /g, "-").replace(/[:.'/]/g, "");
}
