export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateUniqueSlug(baseText: string, existingSlugs: string[]): string {
  let slug = generateSlug(baseText);
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${generateSlug(baseText)}-${counter}`;
    counter++;
  }

  return slug;
}