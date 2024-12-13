export function toSlug(string: string, locale?: string): string {
  const baseString: string = locale ? string.toLocaleLowerCase(locale) : string.toLowerCase();
  return baseString.replace(/ /g, "-").replace(/[:.'/]/g, "");
}

export function truncate(str : string, n : number) {
  return str.length > n ? `${str.slice(0, n)}...` : str;
}
