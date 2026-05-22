export interface ParsedLocaleCode {
  languageCode: string;
  regionCode: string;
}

export function parseLocaleCode(code: string): ParsedLocaleCode {
  const trimmed = code.trim();
  if (!trimmed) {
    return { languageCode: '', regionCode: '' };
  }

  const sep = trimmed.indexOf('-');
  if (sep <= 0) {
    return { languageCode: trimmed, regionCode: '' };
  }

  return {
    languageCode: trimmed.slice(0, sep),
    regionCode: trimmed.slice(sep + 1),
  };
}
