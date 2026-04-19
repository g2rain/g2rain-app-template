/**
 * 子应用事件适配器工厂
 * 提供适配器的创建和获取方法，支持灵活切换实现
 */

import type { EventAdapter } from '@/components/micro-app';
import { QiankunSubAppEventAdapter } from './adapter.qiankun';
import { isIntegrateMode } from '@shared/utils/mode.util';

/**
 * 当前使用的适配器实例
 */
let currentAdapter: EventAdapter | null = null;

/**
 * 创建适配器实例
 * 根据当前运行模式自动选择适配器实现
 */
function createAdapter(): EventAdapter {
  // 目前只支持 qiankun 实现
  // 未来可以扩展支持其他微前端框架（如 single-spa、Module Federation 等）
  const adapter = new QiankunSubAppEventAdapter();
  adapter.initEventListeners();
  return adapter;
}

/**
 * 获取当前的事件适配器实例
 * 如果尚未创建，则自动创建
 */
export function getEventAdapter(): EventAdapter {
  if (!currentAdapter) {
    currentAdapter = createAdapter();
  }
  return currentAdapter;
}

/**
 * 设置自定义的事件适配器实例
 * 用于测试或切换不同的实现
 * @param adapter 适配器实例
 */
export function setEventAdapter(adapter: EventAdapter): void {
  currentAdapter = adapter;
}

/**
 * 重置适配器实例
 * 下次调用 getEventAdapter 时会重新创建
 */
export function resetEventAdapter(): void {
  currentAdapter = null;
}

// 如需请求主应用刷新 token，请直接使用 getEventAdapter().requestToken(request)

