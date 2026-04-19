/**
 * 微前端工具函数
 * 用于判断应用运行模式
 */

import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper';

/**
 * 判断应用是否被集成到主应用中
 */
export function isIntegrateMode(): boolean {
  return !!(qiankunWindow.__POWERED_BY_QIANKUN__);
}

/**
 * 判断应用是否运行在 Qiankun 模式下
 */
export function isQianKunMode(): boolean {
  return !!(qiankunWindow.__POWERED_BY_QIANKUN__);
}
