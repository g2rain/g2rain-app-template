/**
 * Docs 类型拦截器
 * 用于接口文档等开放接口，直接返回数据
 */

import type { AxiosInstance } from 'axios';
import { setupBaseRequestInterceptor, setupBaseResponseInterceptor, type InterceptorOptions } from './base';

/**
 * 设置 Docs 类型的请求拦截器
 * Docs 类型不需要认证，只需要基础拦截器
 */
export function setupDocsRequestInterceptor(
  instance: AxiosInstance,
  options?: InterceptorOptions,
): void {
  // 只设置基础拦截器（loading、mock）
  setupBaseRequestInterceptor(instance);
}

/**
 * 设置 Docs 类型的响应拦截器
 * Docs 类型直接返回数据，不处理 Result 格式
 */
export function setupDocsResponseInterceptor(
  instance: AxiosInstance,
  options?: InterceptorOptions,
): void {
  // 只设置基础拦截器（loading 关闭）
  setupBaseResponseInterceptor(instance);
}

/**
 * 设置 Docs 类型的所有拦截器
 */
export function setupDocsInterceptors(
  instance: AxiosInstance,
  options?: InterceptorOptions,
): void {
  setupDocsRequestInterceptor(instance, options);
  setupDocsResponseInterceptor(instance, options);
}
