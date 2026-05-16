/**
 * HTTP 客户端组件入口
 *
 * - 负责类型导出与实例选择（getHttpClient）
 * - 为每个 HttpClientType 维护对应的 HttpClientOptions，并提供更新方法
 * - 具体的初始化与实例工厂逻辑在 `client.ts` 中实现
 */
import type { HttpClient, HttpClientInstance, HttpClientOptions, HttpClientType, ResponseTypeMap, Result, HttpAuthSession, EnsureAccessTokenOptions } from './types';
import { createHttpClient } from './client';
import { env, getPathWithContextPath } from '@shared/env';
import { isIntegrateMode } from '@shared/utils/mode.util';
import type { MicroAppProps } from '@platform/apps/types';

/**
 * 每个 HttpClientType 对应的默认配置
 * - default：默认业务客户端（带认证）
 * - auth：用于创建 token 相关的客户端（不走认证拦截器）
 */
const httpClientOptionsMap: {
  [K in HttpClientType]: HttpClientOptions<ResponseTypeMap[K]>;
} = {
  default: {
    baseURL: `${env.VITE_CONTEXT_PATH}/api`,
    withAuth: true,
    isDirectResponse: false, // 使用标准的 Result<T> 格式
  },
  auth: {
    baseURL: env.VITE_CONTEXT_PATH,
    withAuth: false,
    isDirectResponse: true, // 直接返回数据，不包装 Result
  },
};

/**
 * 每个 HttpClientType 对应的单例实例缓存
 */
const clientInstanceMap = new Map<HttpClientType, HttpClientInstance<any>>();

/**
 * 获取指定类型的 HttpClient 实例（单例）
 * @template T HttpClientType
 */
export function getHttpClient<T extends HttpClientType = 'default'>(type: T = 'default' as T): HttpClient<ResponseTypeMap[T]> {
  if (!clientInstanceMap.has(type)) {
    const options = httpClientOptionsMap[type] || {};
    clientInstanceMap.set(type, createHttpClient<ResponseTypeMap[T]>(options, type));
  }

  return clientInstanceMap.get(type)!.client as HttpClient<ResponseTypeMap[T]>;
}

/**
 * 覆盖指定类型的 HttpClientOptions，并重置对应单例
 * @template T HttpClientType
 */
export function setHttpClientOptions<T extends HttpClientType>(type: T, options: HttpClientOptions<ResponseTypeMap[T]>): void {
  httpClientOptionsMap[type] = options;
  clientInstanceMap.delete(type);
}

/**
 * 合并更新指定类型的 HttpClientOptions，并重置对应单例
 * @template T HttpClientType
 */
export function updateHttpClientOptions<T extends HttpClientType>(type: T, patch: Partial<HttpClientOptions<ResponseTypeMap[T]>>): void {
  httpClientOptionsMap[type] = {
    ...(httpClientOptionsMap[type] || {}),
    ...patch,
  };
  clientInstanceMap.delete(type);
}

/**
 * 更新指定类型的 baseURL，并重新创建 HttpClient 实例
 * @template T HttpClientType
 * @param type HttpClient 类型
 * @param baseURL 新的 baseURL
 */
export function updateHttpBaseURL<T extends HttpClientType>(type: T, baseURL: string): void {
  updateHttpClientOptions(type, { baseURL });
  // 如果实例已存在，立即重新创建
  if (clientInstanceMap.has(type)) {
    const options = httpClientOptionsMap[type] || {};
    clientInstanceMap.set(type, createHttpClient<ResponseTypeMap[T]>(options, type));
  }
}

/**
 * 根据当前 props 重新计算并更新 baseURL
 * 用于在 qiankun mount 后更新 baseURL
 * 同时更新 default 和 auth 类型的 baseURL
 */
export function updateHttpBaseURLFromProps(): void {
  let newDefaultBaseURL = getPathWithContextPath('/api');
  let newAuthBaseURL = getPathWithContextPath('');

  if (isIntegrateMode()) {
    try {
      const props = (window as any).__QIANKUN_PROPS__ as MicroAppProps | undefined;
      if (props && props.entryOrigin) {
        // 确保 entryOrigin 包含协议（如果缺少，添加当前页面的协议）
        let entryOrigin = new URL(props.entryOrigin, window.location.origin).origin;
        // 使用 activeRule 拼接路径
        // activeRule 如 '/manager'，需要拼接到 entryOrigin 后面
        const cleanActiveRule = `/${props.activeRule || ''}`.replace(/\/+/g, '/').replace(/\/$/, '');
        // 拼接 baseURL：entryOrigin + activeRule + /api
        // 使用 URL 对象确保正确拼接，避免相对路径问题
        try {
          newDefaultBaseURL = new URL(`${cleanActiveRule}/api`, entryOrigin).toString();
        } catch {
          // 如果 URL 构造失败，使用字符串拼接（但确保 entryOrigin 以 / 结尾或 cleanActiveRule 以 / 开头）
          newDefaultBaseURL = `${entryOrigin}${cleanActiveRule}/api`.replace(/\/+/g, '/');
        }

        try {
          newAuthBaseURL = new URL(cleanActiveRule || '/', entryOrigin).toString();
        } catch {
          // 如果 URL 构造失败，使用字符串拼接
          newAuthBaseURL = `${entryOrigin}${cleanActiveRule}`.replace(/\/+/g, '/');
        }

        console.log('[updateHttpBaseURLFromProps] 集成模式，使用 entry origin 和 activeRule:', {
          entryOrigin: props.entryOrigin,
          normalizedEntryOrigin: entryOrigin,
          activeRule: props.activeRule,
          cleanActiveRule,
          defaultBaseURL: newDefaultBaseURL,
          authBaseURL: newAuthBaseURL,
        });
      } else {
        console.warn('[updateHttpBaseURLFromProps] 集成模式但无法从 props 获取 entry origin，使用默认值');
      }
    } catch (error) {
      console.warn('[updateHttpBaseURLFromProps] 获取 entry origin 失败:', error);
    }
  }

  updateHttpBaseURL('default', newDefaultBaseURL);
  updateHttpBaseURL('auth', newAuthBaseURL);
}

export type {
  HttpClient,
  HttpClientInstance,
  HttpClientOptions,
  HttpClientType,
  Result,
  HttpAuthSession,
  EnsureAccessTokenOptions,
};

// 导出 DPoP 签名相关功能
export {
  dpopSign,
  generateDpopHeader,
  generateDpop,
  fetchIamKeyId,
  fetchIamPublicKey,
} from './sign';
export type { DpopHeader, DpopPayload, Client } from './types';
