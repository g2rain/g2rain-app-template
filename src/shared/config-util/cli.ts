/**
 * 配置生成工具 CLI
 * 用于根据 route-map.ts 生成资源配置文件
 */

import { generateConfig } from './index';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    const routeMapPath = path.resolve(__dirname, '../../views/route-map.ts');
    const viewsDir = path.resolve(__dirname, '../../views');
    const outputDir = path.resolve(__dirname, 'config');

    console.log('🚀 开始生成资源配置...');
    console.log('📁 路由映射文件:', routeMapPath);
    console.log('📁 视图目录:', viewsDir);
    console.log('📁 输出目录:', outputDir);

    await generateConfig({
      routeMapPath,
      viewsDir,
      outputDir,
    });

    console.log('✅ 资源配置生成完成！');
  } catch (err: any) {
    console.error('❌ 生成失败:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();

