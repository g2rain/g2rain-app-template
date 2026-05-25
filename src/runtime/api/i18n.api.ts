import { getHttpClient, type Result } from '@/components/http';

export interface I18nLocaleMessage {
  messageCode: string;
  messageText: string;
  extendField?: string;
}

/** GET /api/infra/i18n_message/locale?tag=TEMPLATE&locale=zh-CN */
export async function fetchI18nLocaleMessages(locale: string): Promise<I18nLocaleMessage[]> {
  const httpClient = getHttpClient('auth');
  const result = (await httpClient.get('/api/infra/i18n_message/locale', {
    tag: 'TEMPLATE',
    locale: locale.trim(),
  })) as Result<I18nLocaleMessage[]>;

  return result.data ?? [];
}
