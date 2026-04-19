/**
 * 解析 API 文件，提取 API 端点
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ResourcePage, ResourceApiEndpoint } from '@runtime/boot/types';

/**
 * 从 API 路径提取 API 标签（分类）
 * 例如: '/dict' -> '字典管理'
 */
function getApiTag(apiPath: string, pageName: string): string {
  // 可以根据路径或页面名称生成标签
  // 这里简单使用页面名称
  return pageName;
}

/**
 * 从 HTTP 方法生成 API 名称
 */
function getApiName(method: string, path: string): string {
  // 从路径提取资源名称
  // 例如: '/dict/page' -> '分页查询'
  // '/dict/123' -> '详情查询'
  if (path.includes('/page')) {
    return '分页查询';
  } else if (path.match(/\/:\w+$/)) {
    // 路径参数，如 /dict/:id
    if (method === 'GET') {
      return '详情查询';
    } else if (method === 'DELETE') {
      return '删除';
    } else if (method === 'PUT' || method === 'PATCH') {
      return '更新';
    }
  } else if (path.includes('/save')) {
    return '保存';
  } else if (path.includes('/list')) {
    return '列表查询';
  }

  // 根据 HTTP 方法生成默认名称
  const methodMap: Record<string, string> = {
    GET: '查询',
    POST: '新增',
    PUT: '更新',
    DELETE: '删除',
    PATCH: '更新',
  };

  return methodMap[method] || method;
}

/**
 * 解析单个 API 文件
 */
function parseApiFile(filePath: string, pageCode: string, pageName: string): ResourceApiEndpoint[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const endpoints: ResourceApiEndpoint[] = [];

  // 匹配 http.get/post/put/delete 调用
  // 例如: http.get<Dict[]>('/dict', params)
  // 例如: http.post<Dict>('/dict/save', payload)
  // 例如: http.delete(`/dict/${id}`)
  const httpMethodPatterns = [
    { method: 'GET', pattern: /http\.get<[^>]*>\(['"`]([^'"`]+)['"`]/g },
    { method: 'POST', pattern: /http\.post<[^>]*>\(['"`]([^'"`]+)['"`]/g },
    { method: 'PUT', pattern: /http\.put<[^>]*>\(['"`]([^'"`]+)['"`]/g },
    { method: 'DELETE', pattern: /http\.delete\(['"`]([^'"`]+)['"`]/g },
    { method: 'PATCH', pattern: /http\.patch<[^>]*>\(['"`]([^'"`]+)['"`]/g },
  ];

  for (const { method, pattern } of httpMethodPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      let apiPath = match[1];

      // 处理模板字符串，例如 `/dict/${id}` -> `/dict/:id`
      apiPath = apiPath.replace(/\$\{[^}]+\}/g, ':id');

      // 跳过空路径
      if (!apiPath || apiPath.trim() === '') {
        continue;
      }

      // 确保路径以 / 开头
      if (!apiPath.startsWith('/')) {
        apiPath = '/' + apiPath;
      }

      const apiName = getApiName(method, apiPath);
      const apiTag = getApiTag(apiPath, pageName);

      endpoints.push({
        apiName,
        apiUrl: apiPath,
        requestMethod: method,
        apiTag,
      });
    }
  }

  return endpoints;
}

/**
 * 解析 views 目录下的所有 API 文件
 */
export async function parseApiFiles(
  viewsDir: string,
  pages: ResourcePage[]
): Promise<ResourceApiEndpoint[]> {
  const allEndpoints: ResourceApiEndpoint[] = [];

  // 为每个页面查找对应的 API 文件
  for (const page of pages) {
    // 根据 linkPath 推断 API 文件路径
    // 例如: '/dict' -> 'views/dict/api.ts'
    const routePath = page.linkPath.replace(/^\//, '');
    const apiFilePath = path.join(viewsDir, routePath, 'api.ts');

    if (fs.existsSync(apiFilePath)) {
      console.log(`   📄 解析 ${apiFilePath}...`);
      const endpoints = parseApiFile(apiFilePath, page.pageCode, page.pageName);
      allEndpoints.push(...endpoints);
      if (endpoints.length > 0) {
        console.log(`      ✓ 找到 ${endpoints.length} 个 API 端点`);
      }
    } else {
      console.warn(`   ⚠️  未找到文件: ${apiFilePath}`);
    }

    // 同页面子目录内的补充 API（如 dictionary_usage/dictionary_item/api.ts）
    const nestedApiPath = path.join(viewsDir, routePath, 'dictionary_item', 'api.ts');
    if (fs.existsSync(nestedApiPath)) {
      console.log(`   📄 解析 ${nestedApiPath}...`);
      const nestedEndpoints = parseApiFile(nestedApiPath, page.pageCode, page.pageName);
      allEndpoints.push(...nestedEndpoints);
      if (nestedEndpoints.length > 0) {
        console.log(`      ✓ 找到 ${nestedEndpoints.length} 个 API 端点`);
      }
    }
  }

  return allEndpoints;
}

