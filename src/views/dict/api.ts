/**
 * dict 相关 API（供 DictSelect 复用的 apiMethod）
 */

import { getHttpClient } from '@/components/http';
import type { RemoteSelectOption } from '@/components';
import type { DictItem } from './type';
import type { PageData } from '@platform/types/api.type';

// 导入 mock 数据以触发自动注册（副作用导入）
import './mock';

export class DictItemApi {
  /**
   * 短期缓存（用于同页内去重、合并并发请求）
   * - key: usageCode + keyword
   * - value: promise + 过期时间
   */
  private static readonly selectCache = new Map<
    string,
    {
      expiresAt: number;
      promise: Promise<RemoteSelectOption[]>;
    }
  >();

  /** 默认缓存 TTL（毫秒） */
  private static readonly selectCacheTtlMs = 3000;

  private static buildSelectCacheKey(params: Record<string, any>): string {
    const usageCode = String(params.usageCode || '').trim();
    const key = String(params.key || '').trim();
    const pageNum = params.pageNum ?? params.page;
    const pageSize = params.pageSize ?? params.size;
    return JSON.stringify({ usageCode, key, pageNum, pageSize });
  }

  private static gcSelectCache(now = Date.now()): void {
    for (const [k, v] of DictItemApi.selectCache) {
      if (v.expiresAt <= now) {
        DictItemApi.selectCache.delete(k);
      }
    }
  }

  /**
   * 给 DictSelect 使用的 apiMethod（仅按 name 搜索关键字）
   * - DictSelect 会把输入关键字统一映射为 `params.key`
   * - 默认列表走 infra 的 `page`：`/infra/dictionary_item/page`
   * - 当 `key` 为空但 `usageCode` 存在时：默认拉取第一页（pageNum=1, pageSize=10）
   */
  static async select(params: { key?: string; usageCode?: string }): Promise<RemoteSelectOption[]> {
    const http = getHttpClient('default');

    const key = params.key?.trim();
    const usageCode = params.usageCode?.trim();

    // 没有用途编码且没有关键字：无法限定字典范围，直接返回空
    if (!usageCode && !key) return [];

    const normalized: Record<string, any> = {
      ...(usageCode ? { usageCode } : {}),
      ...(key ? { key } : {}),
      // 无关键字时默认分页拉取（满足“打开下拉默认有数据”）
      ...(!key
        ? {
            pageNum: 1,
            pageSize: 10,
          }
        : {}),
    };

    // 短期缓存：同 usageCode + key 在 TTL 内复用（包含并发 promise）
    const now = Date.now();
    DictItemApi.gcSelectCache(now);
    const cacheKey = DictItemApi.buildSelectCacheKey(normalized);
    const cached = DictItemApi.selectCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.promise;
    }

    const promise = (async () => {
      const res = await http.get<PageData<DictItem>>('/infra/dictionary_item/page', normalized);
      return res.data?.records || [];
    })();

    DictItemApi.selectCache.set(cacheKey, {
      expiresAt: now + DictItemApi.selectCacheTtlMs,
      promise,
    });

    try {
      return await promise;
    } catch (e) {
      // 请求失败不缓存
      DictItemApi.selectCache.delete(cacheKey);
      throw e;
    }
  }
}

