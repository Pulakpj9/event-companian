import { describe, expect, it } from 'vitest';
import { contentLocale, selectTranslation } from '../../src/shared/values/localization.js';

const translations = [
  { locale: 'en-GB', content: 'Source' },
  { locale: 'en', content: 'English' },
  { locale: 'zh-Hant', content: 'Traditional script' },
  { locale: 'zh-Hant-HK', content: 'Hong Kong' },
  { locale: 'zh-Hans', content: 'Simplified script' },
];

describe('translation fallback', () => {
  it('canonicalizes tags and ignores formatting preferences in content lookup', () => {
    expect(contentLocale('ZH-hant-hk-u-nu-hanidec')).toBe('zh-Hant-HK');
    expect(selectTranslation(translations, 'ZH-hant-hk-u-nu-hanidec', 'en-GB'))
      .toEqual({ locale: 'zh-Hant-HK', content: 'Hong Kong' });
  });

  it('preserves the requested script when falling back from a region', () => {
    expect(selectTranslation(translations, 'zh-Hant-TW', 'en-GB').locale).toBe('zh-Hant');
    expect(selectTranslation(translations, 'en-US', 'en-GB').locale).toBe('en');
  });

  it('uses the explicit source when there is no requested translation', () => {
    expect(selectTranslation(translations, 'fr-FR', 'en-GB').locale).toBe('en-GB');
  });

  it('rejects malformed locales, missing source and duplicate canonical keys', () => {
    expect(() => contentLocale('en_GB')).toThrow(RangeError);
    expect(() => selectTranslation(translations, 'en', 'fr')).toThrow('source-language');
    expect(() => selectTranslation([...translations, { locale: 'EN-gb-u-nu-latn', content: 'Duplicate' }], 'en', 'en-GB'))
      .toThrow('Duplicate translation for en-GB');
  });
});
