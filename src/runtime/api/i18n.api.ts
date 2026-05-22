import { getHttpClient, type Result } from '@/components/http';

export interface I18nLocaleMessage {
  messageCode: string;
  messageText: string;
  extendField?: string;
}

export async function fetchI18nLocaleMessages(languageCode: string, regionCode: string): Promise<I18nLocaleMessage[]> {
  const httpClient = getHttpClient('auth');
  const result = (await httpClient.get('/api/infra/i18n_message/locale', {
    tag: 'TEMPLATE',
    languageCode,
    regionCode,
    messageUsageCode: 'UI_MESSAGE',
  })) as Result<I18nLocaleMessage[]>;

  return result.data ?? [];
}
