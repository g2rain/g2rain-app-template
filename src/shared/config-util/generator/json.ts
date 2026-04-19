/**
 * 生成 JSON 配置文件
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  ResourcePage,
  ResourcePageElement,
  ResourceApiEndpoint,
  ApplicationResources,
} from '@runtime/boot/types';

export interface ResourceData {
  pages: ResourcePage[];
  pageElements: ResourcePageElement[];
  apiEndpoints: ResourceApiEndpoint[];
}

/**
 * 生成 JSON 配置文件
 */
export async function generateJsonFiles(
  outputDir: string,
  data: ResourceData
): Promise<void> {
  // 1. 生成完整的资源配置文件
  const resources: ApplicationResources = {
    pages: data.pages,
    pageElements: data.pageElements,
    apiEndpoints: data.apiEndpoints,
  };

  const resourcesPath = path.join(outputDir, 'resources.json');
  fs.writeFileSync(resourcesPath, JSON.stringify(resources, null, 2), 'utf-8');
  console.log(`   ✓ 生成 ${resourcesPath}`);

  // 2. 分别生成各个资源的配置文件
  const pagesPath = path.join(outputDir, 'pages.json');
  fs.writeFileSync(pagesPath, JSON.stringify(data.pages, null, 2), 'utf-8');
  console.log(`   ✓ 生成 ${pagesPath}`);

  const pageElementsPath = path.join(outputDir, 'page-elements.json');
  fs.writeFileSync(pageElementsPath, JSON.stringify(data.pageElements, null, 2), 'utf-8');
  console.log(`   ✓ 生成 ${pageElementsPath}`);

  const apiEndpointsPath = path.join(outputDir, 'api-endpoints.json');
  fs.writeFileSync(apiEndpointsPath, JSON.stringify(data.apiEndpoints, null, 2), 'utf-8');
  console.log(`   ✓ 生成 ${apiEndpointsPath}`);
}

