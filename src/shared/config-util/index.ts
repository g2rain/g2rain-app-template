/**
 * 配置生成工具主入口
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseRouteMap } from './parser/route-map';
import { parseVueFiles } from './parser/vue';
import { parseApiFiles } from './parser/api';
import { generateJsonFiles } from './generator/json';
import type { ResourcePage, ResourcePageElement, ResourceApiEndpoint } from '@runtime/boot/types';

export interface GenerateConfigOptions {
  routeMapPath: string;
  viewsDir: string;
  outputDir: string;
}

export async function generateConfig(options: GenerateConfigOptions): Promise<void> {
  const { routeMapPath, viewsDir, outputDir } = options;

  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. 解析 route-map.ts 生成 page resource
  console.log('📖 解析路由映射文件...');
  const pages = await parseRouteMap(routeMapPath);
  console.log(`   ✓ 找到 ${pages.length} 个页面资源`);

  // 2. 解析 Vue 文件生成 page element
  console.log('📖 解析 Vue 文件中的权限指令...');
  const pageElements = await parseVueFiles(viewsDir, pages);
  console.log(`   ✓ 找到 ${pageElements.length} 个页面元素`);

  // 3. 解析 API 文件生成 api endpoint
  console.log('📖 解析 API 文件...');
  const apiEndpoints = await parseApiFiles(viewsDir, pages);
  console.log(`   ✓ 找到 ${apiEndpoints.length} 个 API 端点`);

  // 4. 生成 JSON 配置文件
  console.log('📝 生成 JSON 配置文件...');
  await generateJsonFiles(outputDir, {
    pages,
    pageElements,
    apiEndpoints,
  });
  console.log('   ✓ 配置文件生成完成');
}

