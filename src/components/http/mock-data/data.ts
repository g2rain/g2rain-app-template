/**
 * Mock 数据定义（components/http 版本）
 * 在这里定义各个 URL 对应的 mock 数据
 */

import type { MockDataMap, MockDataFunction } from './index';
import type { Result } from '../types';
import { mockMenuList, authMockDataMap, IAM_PUBLIC_KEY, IAM_KEY_ID } from './data/auth.data';
import { testMockDataMap } from './data/test.api';
import resourcesConfig from '@shared/config-util/config/resources.json';

interface ResourcePageMock {
  pageName: string;
  pageCode: string;
  linkPath: string;
}

interface ResourcePageElementMock {
  parentId: number | null;
  pageElementName: string;
  pageElementCode: string;
  pageElementType: string;
  pageCode: string;
  status: string;
}

interface ResourceApiEndpointMock {
  apiName: string;
  apiUrl: string;
  requestMethod: string;
  apiTag: string;
}

interface ApplicationResourcesMock {
  pages: ResourcePageMock[];
  pageElements: ResourcePageElementMock[];
  apiEndpoints: ResourceApiEndpointMock[];
}

function createResult<T>(data: T): Result<T> {
  return {
    requestId: 'mock-request-id',
    requestTime: new Date().toISOString(),
    status: 200,
    errorCode: '',
    errorMessage: '',
    data,
  };
}

/**
 * Mock 数据映射
 * 在这里添加你的 mock 数据
 *
 * 支持通配符配置：
 * - 精确匹配：'/api/example/info' - 精确匹配该 URL
 * - 通配符匹配：'/api/example/*' - 匹配所有以 '/api/example/' 开头的 URL
 *
 * Mock 数据类型：
 * - 对象：返回 JSON 格式响应
 * - 字符串：返回纯文本格式响应（Content-Type: text/plain）
 * - 函数：根据请求配置动态生成响应数据
 */
export const mockDataMap: MockDataMap = {
  // 菜单列表接口
  '/menu/list': {
    requestId: 'mock-request-id',
    requestTime: new Date().toISOString(),
    status: 200,
    errorCode: '',
    errorMessage: '',
    data: mockMenuList,
  } as Result,

  // GET /basis/authority/resources - 资源接口
  // 从 config 读取 pages/pageElements/apiEndpoints 数据
  '/basis/authority/resources': (() => {
    const pages = (resourcesConfig.pages ?? []) as ResourcePageMock[];
    const pageElements = (resourcesConfig.pageElements ?? []) as ResourcePageElementMock[];
    const apiEndpoints = (resourcesConfig.apiEndpoints ?? []) as ResourceApiEndpointMock[];
    const resources: ApplicationResourcesMock = {
      pages,
      pageElements,
      apiEndpoints,
    };
    return createResult(resources);
  }) as MockDataFunction,

  // GET /keys/iam-public-key - 获取 IAM 公钥
  // 返回纯文本格式的 PEM 公钥（注意：此接口返回纯文本，不是 JSON）
  // 支持两种格式：/keys/iam-public-key 和 /*/keys/iam-public-key（如 /main/keys/iam-public-key）
  '/keys/iam-public-key': IAM_PUBLIC_KEY,
  '/*/keys/iam-public-key': IAM_PUBLIC_KEY,

  // GET /keys/iam-key-id - 获取 IAM Key ID
  // 返回纯文本格式的 Key ID（注意：此接口返回纯文本，不是 JSON）
  // 支持两种格式：/keys/iam-key-id 和 /*/keys/iam-key-id（如 /main/keys/iam-key-id）
  '/keys/iam-key-id': IAM_KEY_ID,
  '/*/keys/iam-key-id': IAM_KEY_ID,

  // 认证相关接口（从 auth.data.ts 导入）
  ...authMockDataMap,

  // 测试相关接口（从 test.api.ts 导入）
  ...testMockDataMap,

  // 可以添加更多 mock 数据
  // '/api/example/info': { ... },
  // '/api/system/*': (config) => { ... },
};
