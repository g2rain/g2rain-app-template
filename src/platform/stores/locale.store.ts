import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { LocaleOption } from '@platform/locale';
import { parseLocaleCode, loadSavedLocaleCode, saveLocaleCode } from '@platform/locale';
import { getLocaleCodeNameList, type LocaleCodeName } from '@/runtime/api/locale.api';
import { loadAndApplyI18nMessages } from '@platform/i18n';

function toLocaleOption(item: LocaleCodeName): LocaleOption {
  const { languageCode, regionCode } = parseLocaleCode(item.code);
  return {
    code: item.code,
    name: item.name,
    languageCode,
    regionCode,
  };
}

function resolveInitialCode(options: LocaleOption[], savedCode: string | null): string {
  if (savedCode && options.some((o) => o.code === savedCode)) {
    return savedCode;
  }
  return options[0]?.code ?? '';
}

function buildOptionFromCode(code: string): LocaleOption | null {
  const trimmed = code.trim();
  if (!trimmed) {
    return null;
  }
  const { languageCode, regionCode } = parseLocaleCode(trimmed);
  return {
    code: trimmed,
    name: trimmed,
    languageCode,
    regionCode,
  };
}

export const useLocaleStore = defineStore('locale', () => {
  const options = ref<LocaleOption[]>([]);
  const currentCode = ref('');
  const initialized = ref(false);
  let initializing: Promise<void> | null = null;

  const current = computed<LocaleOption | null>(() => {
    if (!currentCode.value) {
      return null;
    }
    return options.value.find((o) => o.code === currentCode.value) ?? buildOptionFromCode(currentCode.value);
  });

  const languageCode = computed(() => current.value?.languageCode ?? '');
  const regionCode = computed(() => current.value?.regionCode ?? '');
  const acceptLanguage = computed(() => currentCode.value);

  async function syncI18nMessages(force = false): Promise<void> {
    const locale = current.value;
    if (!locale?.languageCode || !currentCode.value) {
      return;
    }
    await loadAndApplyI18nMessages(currentCode.value, locale.languageCode, locale.regionCode ?? '', force);
  }

  function applyCurrentCode(code: string): void {
    if (!code || !options.value.some((o) => o.code === code)) {
      return;
    }
    currentCode.value = code;
    saveLocaleCode(code);
  }

  async function initialize(): Promise<void> {
    if (initialized.value) {
      return;
    }
    if (initializing) {
      return initializing;
    }

    initializing = (async () => {
      try {
        const list = await getLocaleCodeNameList();
        const mapped = list.map(toLocaleOption);
        options.value = mapped;

        const saved = loadSavedLocaleCode();
        const code = resolveInitialCode(mapped, saved);
        if (code) {
          currentCode.value = code;
          saveLocaleCode(code);
        } else {
          currentCode.value = '';
        }

        initialized.value = true;
        await syncI18nMessages(true);
        console.log('[LocaleStore] 语言列表初始化完成:', currentCode.value || '(无可用项)');
      } catch (error) {
        console.error('[LocaleStore] 语言列表初始化失败:', error);
        throw error;
      } finally {
        initializing = null;
      }
    })();

    return initializing;
  }

  async function setCurrentCode(code: string): Promise<void> {
    if (!initialized.value) {
      console.warn('[LocaleStore] 尚未初始化，忽略切换:', code);
      return;
    }
    if (currentCode.value === code) {
      return;
    }
    applyCurrentCode(code);
    await syncI18nMessages(true);
  }

  /** 集成模式：主应用通过 props.localeCode 驱动 */
  async function applyFromMain(localeCode: string): Promise<void> {
    const trimmed = localeCode.trim();
    if (!trimmed) {
      return;
    }
    if (currentCode.value === trimmed && initialized.value) {
      return;
    }
    currentCode.value = trimmed;
    initialized.value = true;
    await syncI18nMessages(true);
    console.log('[LocaleStore] 已应用主应用语言:', trimmed);
  }

  function reset(): void {
    options.value = [];
    currentCode.value = '';
    initialized.value = false;
    initializing = null;
  }

  return {
    options,
    currentCode,
    current,
    languageCode,
    regionCode,
    acceptLanguage,
    initialized,
    initialize,
    setCurrentCode,
    applyFromMain,
    reset,
  };
});
