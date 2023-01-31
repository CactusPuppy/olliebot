export function toSlug(string: string, locale?: string): string {
  const baseString: string = locale ? string.toLocaleLowerCase(locale) : string.toLowerCase();
  return baseString.replace(/ /g, "-").replace(/[:.'/]/g, "");
}
