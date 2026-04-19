/**
 * 解析 route-map.ts 文件，提取页面资源
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ResourcePage } from '@runtime/boot/types';

/**
 * 从路由路径生成页面编码
 * 例如: '/dict' -> 'dict', '/system/user' -> 'system-user'
 */
function pathToPageCode(routePath: string): string {
  return routePath
    .replace(/^\//, '')
    .replace(/\//g, '-')
    .toLowerCase();
}

/**
 * 解析 route-map.ts 文件
 */
export async function parseRouteMap(routeMapPath: string): Promise<ResourcePage[]> {
  const content = fs.readFileSync(routeMapPath, 'utf-8');
  const pages: ResourcePage[] = [];

  // 解析 routeMap（统一的路由配置表）
  // 匹配 export const routeMap = { ... } 整个对象
  const routeMapMatch = content.match(/export const routeMap[^=]*=\s*\{([\s\S]*?)\};/);
  if (!routeMapMatch) {
    throw new Error('无法找到 routeMap');
  }

  const routeMapContent = routeMapMatch[1];

  // 解析每个路由的元数据
  // 格式: '/dict': { component: ..., name: 'xxx', meta: { title: '字典配置', ... } },
  // 使用非贪婪匹配来匹配每个路由项
  const routePattern = /'([^']+)':\s*\{[\s\S]*?meta:\s*\{[\s\S]*?title:\s*'([^']+)'[\s\S]*?\}/g;
  let match;

  while ((match = routePattern.exec(routeMapContent)) !== null) {
    const routePath = match[1];
    const title = match[2];

    // 跳过根路径和 home 路径
    if (routePath === '/' || routePath === '/home') {
      continue;
    }

    const pageCode = pathToPageCode(routePath);

    pages.push({
      pageName: title,
      pageCode,
      linkPath: routePath,
    });
  }

  return pages;
}

