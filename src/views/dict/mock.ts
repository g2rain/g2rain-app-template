/**
 * dict 相关 Mock 数据
 */

import type { AxiosRequestConfig } from 'axios';
import type { MockDataMap } from '@/components/http/mock-data';
import type { Result } from '@/components/http/types';
import Mock from 'mockjs';
import { mockManager } from '@/components/http/mock-data';

import type { DictItem } from './type';

function createResult<T>(data: T, status: number = 200): Result<T> {
  const result = Mock.mock({
    requestId: '@guid',
    requestTime: '@datetime("yyyy-MM-dd HH:mm:ss")',
    status,
    errorCode: status === 200 ? '' : '@word(5,10)',
    errorMessage: status === 200 ? '' : '@cword(5,15)',
  }) as Result<T>;

  (result as any).data = data;
  return result;
}

function getDictItemTemplate(overrides: Partial<any> = {}): any {
  return {
    'id|+1': 1,
    parentId: null,
    'code|1': ['DICT_CODE_A', 'DICT_CODE_B', 'DICT_CODE_C'],
    'name|1': ['字典项A', '字典项B', '字典项C'],
    description: '@cword(5,10)',
    sortIndex: '@integer(1, 100)',
    version: '@integer(1, 100)',
    createTime: '@datetime("yyyy-MM-dd HH:mm:ss")',
    updateTime: '@datetime("yyyy-MM-dd HH:mm:ss")',
    ...overrides,
  };
}

const dictItems: DictItem[] = Array.from({ length: 18 }).map((_, i) =>
  Mock.mock(
    getDictItemTemplate({
      id: i + 1,
      code: `DICT_CODE_${i + 1}`,
      name: `字典项${i + 1}`,
      sortIndex: i + 1,
      // mock 里额外提供 usageCode 字段，供前端按用途精确过滤
      // 同时兼容历史 mock（USAGE_x）与 CMS 文章页当前使用的用途编码
      usageCode: i % 2 === 0 ? 'CMS_ARTICLE_CONTENT_TYPE' : `USAGE_${(i % 3) + 1}`,
    }),
  ),
);

function filterDictItems(query: Record<string, any>): DictItem[] {
  const code = query?.code;
  const name = query?.name ?? query?.key;
  const usageCode = query?.usageCode;

  let filtered = dictItems;
  if (code) {
    filtered = filtered.filter((item) => String(item.code) === String(code));
  }
  if (name) {
    const keyword = String(name);
    // 兼容 DictSelect 的初始回显：传入 code 时也应能查到对应选项
    filtered = filtered.filter((item) => item.name.includes(keyword) || (item.code || '').includes(keyword));
  }

  if (usageCode) {
    filtered = filtered.filter((item) => String((item as any).usageCode) === String(usageCode));
  }

  return filtered;
}

export const DictItemMockDataMap: MockDataMap = {
  // GET /infra/dictionary_item/list
  '/infra/dictionary_item/list': (config: AxiosRequestConfig) => {
    const query = config.params || {};
    return createResult<DictItem[]>(filterDictItems(query));
  },

  // GET /infra/dictionary_item/localized_options（字典组件，已国际化，无分页）
  '/infra/dictionary_item/localized_options': (config: AxiosRequestConfig) => {
    const query = config.params || {};
    return createResult<DictItem[]>(filterDictItems(query));
  },
};

mockManager.registerAll(DictItemMockDataMap);

