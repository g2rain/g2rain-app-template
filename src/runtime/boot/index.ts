/**
 * 应用初始化入口
 * 负责初始化应用资源、路由和权限控制
 */

import { watch, type WatchStopHandle } from 'vue';
import { resourceManager } from './resource';
import { initRoutesFromResources } from './router';
import type { ApplicationResources } from './types';
import { useAccessTokenStore } from '@platform/stores';
import { env } from '@shared/env';
import { isIntegrateMode } from '@platform/apps';
import { emitTokenInvalid } from '@platform/apps';
import { sso } from '@runtime/auth';
import { initHttp } from '@runtime/http';

export * from './types';
export * from './resource';
export * from './router';

/**
 * 监听 tokenExpired 状态变化
 * - 集成模式：当 token 标记为过期（tokenExpired: false -> true）时，通过事件通知主应用
 * - 独立运行模式：当 token 过期时，触发刷新 token
 */
export function setupTokenExpiredWatcher(): void {
  const accessTokenStore = useAccessTokenStore();
  const mockedSessionInitialized = accessTokenStore.ensureMockSession();
  if (mockedSessionInitialized) {
    if ((import.meta.env as any).DEV) {
      console.log('[boot] mock 会话已初始化，跳过后续 tokenExpired 初始化流程');
    }
    return;
  }

  // 初始化 HTTP 组件（认证会话 + 认证异常处理），需在所有 HTTP 请求之前
  initHttp();

  // 启动时如果已经是 tokenExpired = true，则立即按当前模式处理一次
  if (accessTokenStore.tokenExpired) {
    if (isIntegrateMode()) {
      if ((import.meta.env as any).DEV) {
        console.log('[boot] 启动时检测到 tokenExpired=true，集成模式通知主应用 TOKEN_INVALID 事件');
      }
      emitTokenInvalid(env.VITE_APPLICATION_CODE);
    } else {
      if ((import.meta.env as any).DEV) {
        console.log('[boot] 启动时检测到 tokenExpired=true，独立模式调用 requestRefreshToken 刷新 token');
      }
      void sso.requestRefreshToken().catch((error) => {
        console.error('[boot] 启动时刷新 token 失败:', error);
      });
    }
  }

  watch(
    () => accessTokenStore.tokenExpired,
    async (tokenExpired, prevTokenExpired) => {
      // 仅在状态发生变化时处理
      if (tokenExpired === prevTokenExpired) return;

      // 这里只在从 false 变为 true（标记为过期）时处理
      if (!prevTokenExpired && tokenExpired) {
        if (isIntegrateMode()) {
          // 子应用通知 token 失效事件，主应用收到后会发起统一的 SSO / 刷新流程（与 MICRO_APP_EVENT.TOKEN_INVALID 描述保持一致）
          if ((import.meta.env as any).DEV) {
            console.log('[boot] tokenExpired 变为 true，发送 MICRO_APP_EVENT.TOKEN_INVALID 给主应用');
          }

          emitTokenInvalid(env.VITE_APPLICATION_CODE);
        } else {
          // 独立运行模式：直接调用刷新 token 接口
          if ((import.meta.env as any).DEV) {
            console.log('[boot] tokenExpired 变为 true，独立模式调用 requestRefreshToken 刷新 token');
          }
          try {
            await sso.requestRefreshToken();
          } catch (error) {
            console.error('[boot] 刷新 token 失败:', error);
          }
        }
      }
    },
    { immediate: false },
  );
}

/**
 * 初始化应用资源
 * 使用环境变量 VITE_APPLICATION_CODE 作为应用唯一标识
 *
 * 如果当前路径是 SSO 回调路径，会启动一个 watch 监听登录状态变化，
 * 当 token 为已登录时自动初始化资源并更新路由
 */
export async function initApplicationResources(): Promise<void> {
  // 检查当前路径是否为 SSO 回调路径
  const currentPath = window.location.pathname;
  const contextPath = env.VITE_CONTEXT_PATH || '';
  const isSSOCallback =
    currentPath === '/sso_callback' ||
    currentPath === contextPath + '/sso_callback' ||
    (contextPath && currentPath === contextPath + 'sso_callback') ||
    currentPath.endsWith('/sso_callback');

  // 如果是 SSO 回调路径，启动 watch 监听登录状态
  if (isSSOCallback) {
    if ((import.meta.env as any).DEV) {
      console.log('[initApplicationResources] 检测到 SSO 回调路径，启动登录状态监听');
    }

    return new Promise<void>((resolve, reject) => {
      const accessTokenStore = useAccessTokenStore();
      let resolved = false;
      let unwatch: WatchStopHandle | null = null;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      // 初始化资源的函数
      const doInitResources = async () => {
        if (resolved) return;

        try {
          if ((import.meta.env as any).DEV) {
            console.log('[initApplicationResources] 检测到登录状态，开始初始化资源');
          }

          // 初始化资源
          await resourceManager.init();

          // 获取路由实例并更新路由
          const { getRouterInstance } = await import('@runtime/router');
          const router = getRouterInstance();

          if (router) {
            const resourceRoutes = await initRoutesFromResources();
            const { updateRouter } = await import('@runtime/router');
            updateRouter(resourceRoutes);

            if ((import.meta.env as any).DEV) {
              console.log('[initApplicationResources] 资源初始化完成，路由已更新');
            }
          }

          resolved = true;
          if (unwatch) {
            unwatch();
            unwatch = null;
          }
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }

          resolve();
        } catch (error) {
          console.error('[initApplicationResources] 资源初始化失败:', error);
          resolved = true;
          if (unwatch) {
            unwatch();
            unwatch = null;
          }
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          reject(error);
        }
      };

      // 立即检查一次（可能 token 已经设置好了）
      if (accessTokenStore.isLogin) {
        void doInitResources();
        return;
      }

      // 如果 10 秒后仍未登录，可能是 SSO 回调失败，直接 reject
      timeoutId = setTimeout(() => {
        if (!resolved && !accessTokenStore.isLogin) {
          console.warn('[initApplicationResources] SSO 回调超时，未检测到登录状态');
          resolved = true;
          if (unwatch) {
            unwatch();
            unwatch = null;
          }
          reject(new Error('SSO 回调超时，未检测到登录状态'));
        }
      }, 10000);

      // 监听登录状态变化
      unwatch = watch(
        () => accessTokenStore.isLogin,
        (isLogin) => {
          if (isLogin && !resolved) {
            void doInitResources();
          }
        },
        { immediate: false },
      );
    });
  }

  // 正常流程：验证 token 是否登录，然后初始化资源
  const accessTokenStore = useAccessTokenStore();
  if (!accessTokenStore.isLogin) {
    const error = new Error('用户未登录，无法初始化应用资源');
    console.error('[initApplicationResources]', error.message);
    throw error;
  }

  if ((import.meta.env as any).DEV) {
    console.log('[initApplicationResources] 正常流程：用户已登录，开始初始化资源');
  }

  await resourceManager.init();
}

/**
 * 获取资源管理器实例
 */
export { resourceManager };

/**
 * 初始化路由（从资源页面）
 */
export { initRoutesFromResources };

