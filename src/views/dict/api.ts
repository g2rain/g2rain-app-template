/**
 * dict 相关 API（供 DictSelect / DictText 复用的 apiMethod）
 *
 * 使用 GET /infra/dictionary_item/localized_options（已国际化，无分页）
 * 同一 usageCode 在 TTL 内缓存全量列表，按 code / name 优先内存匹配。
 */

import { getHttpClient } from '@/components/http';
import type { RemoteSelectOption } from '@/components';
import type { DictItem } from './type';

// 导入 mock 数据以触发自动注册（副作用导入）
import './mock';

const LOCALIZED_OPTIONS_PATH = '/infra/dictionary_item/localized_options';

/** DictSelect / DictText / loadByUsageCode 统一入参 */
export type DictSelectParams = {
  /** 按 name 模糊搜索 */
  key?: string;
  /** 按 code 精确查询（DictText 回显） */
  code?: string;
  usageCode?: string;
};

export class DictItemApi {
  /** 按 usageCode 缓存（会话内复用） */
  private static readonly usageCache = new Map<
    string,
    {
      expiresAt: number;
      items?: RemoteSelectOption[];
      promise?: Promise<RemoteSelectOption[]>;
    }
  >();

  private static readonly usageCacheTtlMs = 5 * 60 * 1000;

  private static readonly httpCache = new Map<
    string,
    {
      expiresAt: number;
      promise: Promise<RemoteSelectOption[]>;
    }
  >();

  private static readonly httpCacheTtlMs = 3000;

  private static buildUsageCacheKey(usageCode: string): string {
    return usageCode;
  }

  private static buildHttpCacheKey(params: Record<string, unknown>): string {
    return JSON.stringify(params);
  }

  private static gcHttpCache(now = Date.now()): void {
    for (const [k, v] of DictItemApi.httpCache) {
      if (v.expiresAt <= now) {
        DictItemApi.httpCache.delete(k);
      }
    }
  }

  private static buildQuery(params: DictSelectParams): Record<string, unknown> {
    const key = params.key?.trim();
    const code = params.code?.trim();
    const usageCode = params.usageCode?.trim();

    return {
      ...(usageCode ? { usageCode } : {}),
      ...(code ? { code } : {}),
      ...(key ? { name: key } : {}),
    };
  }

  private static async fetchLocalizedOptions(query: Record<string, unknown>): Promise<RemoteSelectOption[]> {
    const now = Date.now();
    DictItemApi.gcHttpCache(now);
    const cacheKey = DictItemApi.buildHttpCacheKey(query);
    const cached = DictItemApi.httpCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.promise;
    }

    const http = getHttpClient('default');
    const promise = (async () => {
      const res = await http.get<DictItem[]>(LOCALIZED_OPTIONS_PATH, query);
      return res.data || [];
    })();

    DictItemApi.httpCache.set(cacheKey, {
      expiresAt: now + DictItemApi.httpCacheTtlMs,
      promise,
    });

    try {
      return await promise;
    } catch (e) {
      DictItemApi.httpCache.delete(cacheKey);
      throw e;
    }
  }

  /**
   * 按 usageCode 加载并缓存字典列表（同页多处复用）
   */
  static async loadByUsageCode(usageCode: string): Promise<RemoteSelectOption[]> {
    const code = usageCode?.trim();
    if (!code) return [];

    const cacheKey = DictItemApi.buildUsageCacheKey(code);
    const now = Date.now();
    const entry = DictItemApi.usageCache.get(cacheKey);
    if (entry?.items && entry.expiresAt > now) {
      return entry.items;
    }
    if (entry?.promise && entry.expiresAt > now) {
      return entry.promise;
    }

    const promise = DictItemApi.fetchLocalizedOptions({ usageCode: code });

    DictItemApi.usageCache.set(cacheKey, {
      expiresAt: now + DictItemApi.usageCacheTtlMs,
      promise,
    });

    try {
      const items = await promise;
      DictItemApi.usageCache.set(cacheKey, {
        expiresAt: Date.now() + DictItemApi.usageCacheTtlMs,
        items,
      });
      return items;
    } catch (e) {
      DictItemApi.usageCache.delete(cacheKey);
      throw e;
    }
  }

  private static filterByName(items: RemoteSelectOption[], keyword: string): RemoteSelectOption[] {
    const key = keyword.trim().toLowerCase();
    if (!key) return items;
    return items.filter((item) => String(item.name ?? '').toLowerCase().includes(key));
  }

  private static filterByCode(items: RemoteSelectOption[], code: string): RemoteSelectOption[] {
    const target = code.trim();
    return items.filter((item) => String(item.code ?? '') === target);
  }

  /** 给 DictSelect / DictText 使用的 apiMethod */
  static async select(params: DictSelectParams): Promise<RemoteSelectOption[]> {
    const key = params.key?.trim();
    const code = params.code?.trim();
    const usageCode = params.usageCode?.trim();

    if (!usageCode && !key && !code) return [];

    if (usageCode) {
      const items = await DictItemApi.loadByUsageCode(usageCode);

      if (code && !key) {
        const matched = DictItemApi.filterByCode(items, code);
        if (matched.length) return matched;
        return DictItemApi.fetchLocalizedOptions({ usageCode, code });
      }

      if (key) {
        const matched = DictItemApi.filterByName(items, key);
        if (matched.length) return matched;
        return DictItemApi.fetchLocalizedOptions({ usageCode, name: key });
      }

      return items;
    }

    return DictItemApi.fetchLocalizedOptions(DictItemApi.buildQuery(params));
  }

  static clearUsageCache(usageCode?: string): void {
    if (!usageCode) {
      DictItemApi.usageCache.clear();
      return;
    }
    DictItemApi.usageCache.delete(DictItemApi.buildUsageCacheKey(usageCode.trim()));
  }
}
