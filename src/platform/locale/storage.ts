const STORAGE_KEY = 'g2rain.locale.code';

export function loadSavedLocaleCode(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw?.trim() || null;
  } catch {
    return null;
  }
}

export function saveLocaleCode(code: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch (error) {
    console.warn('[LocaleStorage] 保存语言选择失败:', error);
  }
}
