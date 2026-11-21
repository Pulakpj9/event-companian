export interface Translation<T> {
  readonly locale: string;
  readonly content: T;
}

export function contentLocale(locale: string): string {
  return new Intl.Locale(locale).baseName;
}

export function selectTranslation<T>(
  translations: readonly Translation<T>[],
  requestedLocale: string,
  sourceLocale: string,
): Translation<T> {
  const byLocale = new Map<string, Translation<T>>();
  for (const translation of translations) {
    const locale = contentLocale(translation.locale);
    if (byLocale.has(locale)) throw new RangeError(`Duplicate translation for ${locale}.`);
    byLocale.set(locale, { locale, content: translation.content });
  }

  const source = byLocale.get(contentLocale(sourceLocale));
  if (!source) throw new RangeError('A source-language translation is required.');

  let candidate = contentLocale(requestedLocale);
  while (candidate) {
    const translation = byLocale.get(candidate);
    if (translation) return translation;
    const separator = candidate.lastIndexOf('-');
    if (separator < 0) break;
    candidate = candidate.slice(0, separator);
  }
  return source;
}
