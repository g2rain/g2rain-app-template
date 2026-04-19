import { createApp, type App as VueApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import { initRouter, updateRouter } from '@runtime/router';
import { setupStore } from '@platform/stores/setup';
import { isIntegrateMode, registerQiankunLifecycle } from '@platform/apps';
import { initApplicationResources, initRoutesFromResources, setupTokenExpiredWatcher } from '@runtime/boot';
import { permissionPlugin } from '@/components/permission';
import { env } from '@shared/env';
import { sso } from '@runtime/auth';

let app: VueApp | null = null;
let router: ReturnType<typeof initRouter> | null = null;

/**
 * 获取挂载容器
 * qiankun 模式：在 container 中查找或创建 #app（参考 g2rain-sub-example）
 * 独立运行模式：使用 document 的 #app
 */
function getMountContainer(container?: HTMLElement): HTMLElement {
  if (container) {
    // qiankun 模式：在 container 中查找 #app，如果不存在则创建
    // 参考 g2rain-sub-example 的实现
    let mountNode = container.querySelector('#app') as HTMLElement;
    if (!mountNode) {
      // 如果 container 中没有 #app，创建一个
      mountNode = document.createElement('div');
      mountNode.id = 'app';
      // 清空 container 并添加 #app
      container.innerHTML = '';
      container.appendChild(mountNode);
    } else {
      // 如果找到了 #app，清空其内容
      mountNode.innerHTML = '';
    }
    return mountNode;
  } else {
    // 独立运行模式：使用 document 的 #app
    const mountNode = document.querySelector('#app') as HTMLElement;
    if (!mountNode) {
      throw new Error('未找到挂载容器 #app');
    }
    return mountNode;
  }
}

/**
 * 初始化路由（从资源接口加载）
 * 在集成模式下，应该在 token 初始化之后调用
 * 在独立模式下，在 render 函数中调用
 */
export async function initRouterFromResources(): Promise<void> {
  if (!env.VITE_APPLICATION_CODE) {
    throw new Error('VITE_APPLICATION_CODE 未配置，无法加载路由。请在环境变量中配置应用编码。');
  }

  try {
    if ((import.meta.env as any).DEV) {
      console.log('[initRouterFromResources] 初始化应用资源，applicationCode:', env.VITE_APPLICATION_CODE);
    }

    // 初始化应用资源（从后端加载页面、页面元素、API端点）
    try {
      await initApplicationResources();
    } catch (error) {
      // 如果未登录，跳转到 SSO
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('未登录')) {
        if ((import.meta.env as any).DEV) {
          console.log('[initRouterFromResources] 检测到未登录，跳转到 SSO');
        }
        await sso.redirectToSSO();
        return; // 跳转后不再继续执行
      }
      // 其他错误继续抛出
      throw error;
    }

    // 从资源中生成路由
    const resourceRoutes = await initRoutesFromResources();
    if ((import.meta.env as any).DEV) {
      console.log('[initRouterFromResources] 从资源接口加载的路由:', resourceRoutes.map(r => ({ path: r.path, name: r.name })));
    }

    if (!resourceRoutes || resourceRoutes.length === 0) {
      if ((import.meta.env as any).DEV) {
        console.warn('[initRouterFromResources] 资源路由为空，将只加载系统路由');
      }
    }

    // 如果 router 已存在（集成模式下），更新路由而不是创建新的
    if (router) {
      updateRouter(resourceRoutes);
      if ((import.meta.env as any).DEV) {
        console.log('[initRouterFromResources] 路由已更新');
      }
    } else {
      // 如果 router 不存在（独立模式下），创建新的路由
      router = initRouter(resourceRoutes);
      if ((import.meta.env as any).DEV) {
        console.log('[initRouterFromResources] 路由初始化完成');
      }
    }
  } catch (error) {
    console.error('[initRouterFromResources] 资源加载失败:', error);
    throw new Error(`资源加载失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 处理路由首次跳转
 */
async function handleInitialRoute(initialRoute?: string): Promise<void> {
  if (!router) {
    return;
  }

  // 等待应用挂载和路由初始化完成
  // await new Promise(resolve => setTimeout(resolve, 100));
  await router.isReady();

  const currentRoute = router.currentRoute.value;
  const matchedCount = currentRoute.matched.length;

  if ((import.meta.env as any).DEV) {
    console.log('[handleInitialRoute] 路由初始化检查:', {
      path: currentRoute.path,
      matched: matchedCount,
      initialRoute,
    });
  }

  // 如果有指定的初始路由，优先使用
  if (initialRoute) {
    try {
      const resolvedRoute = router.resolve(initialRoute);
      if (resolvedRoute.matched.length > 0) {
        await router.replace(initialRoute);
        if ((import.meta.env as any).DEV) {
          console.log('[handleInitialRoute] 已跳转到初始路由:', initialRoute);
        }
        return;
      }
    } catch (err) {
      console.error('[handleInitialRoute] 初始路由跳转失败:', err);
    }
  }

  // 如果路由未匹配，尝试跳转到根路径
  if (matchedCount === 0) {
    const currentPath = currentRoute.path;
    if (currentPath === '/' || currentPath === '') {
      try {
        const homeRoute = router.getRoutes().find(r => r.path === '/');
        if (homeRoute) {
          if ((import.meta.env as any).DEV) {
            console.log('[handleInitialRoute] 路由未匹配，尝试跳转到根路径 /');
          }
          await router.replace('/');
          if ((import.meta.env as any).DEV) {
            console.log('[handleInitialRoute] 已执行路由跳转修复');
          }
        } else {
          if ((import.meta.env as any).DEV) {
            console.warn('[handleInitialRoute] 未找到根路径路由');
          }
        }
      } catch (err) {
        console.error('[handleInitialRoute] 路由跳转修复失败:', err);
      }
    }
  }
}

/**
 * 渲染 Vue 应用（支持独立运行和 qiankun 两种模式）
 * 在集成模式下，只创建应用和挂载，不初始化路由（路由初始化由 adapter.qiankun.ts 负责）
 * 在独立模式下，完成完整的初始化包括路由
 */
async function render(container?: HTMLElement, initialRoute?: string): Promise<{ app: VueApp; mountContainer: HTMLElement }> {
  // 获取挂载容器
  const mountContainer = getMountContainer(container);

  // 创建应用实例
  app = createApp(App);
  setupStore(app);
  app.use(ElementPlus);
  app.use(permissionPlugin);
  // 初始化 tokenExpired 监听（根据运行模式触发不同处理）
  setupTokenExpiredWatcher();

  // 检查当前路径是否为 SSO 回调路径
  const currentPath = window.location.pathname;
  const contextPath = env.VITE_CONTEXT_PATH || '';
  // 处理不同的路径格式：/sso_callback 或 /xxx/sso_callback
  const isSSOCallback =
    currentPath === '/sso_callback' ||
    currentPath === contextPath + '/sso_callback' ||
    (contextPath && currentPath === contextPath + 'sso_callback') ||
    currentPath.endsWith('/sso_callback');

  // 如果是 SSO 回调路径，先初始化路由（使用系统路由），让 SSO 回调组件能够渲染
  if (isSSOCallback) {
    if ((import.meta.env as any).DEV) {
      console.log('[render] 检测到 SSO 回调路径，先初始化系统路由');
    }

    // 先使用空资源路由初始化，只包含系统路由（homeRoutes + authRoutes）
    router = initRouter([]);
    app.use(router);
    app.mount(mountContainer);

    // 等待应用挂载完成
    // await new Promise((resolve) => setTimeout(resolve, 100));

    // initApplicationResources 会启动 watch 监听登录状态，并在登录后自动初始化资源和更新路由
    // 这里只需要等待它完成即可
    try {
      await initApplicationResources();

      // 资源初始化完成后，跳转到目标页面
      if (router) {
        const returnUrl = localStorage.getItem('return_url') || '/';
        localStorage.removeItem('return_url');

        // 等待路由更新完成
        // await new Promise((resolve) => setTimeout(resolve, 100));

        await router.replace(returnUrl);
        await router.isReady();

        if ((import.meta.env as any).DEV) {
          console.log('[render] 已跳转到目标页面:', returnUrl);
        }
      }
    } catch (err) {
      console.error('[render] SSO 回调后资源加载失败:', err);
      // 即使失败也继续，避免阻塞
    }

    return { app, mountContainer };
  }

  // 集成模式（qiankun）：只创建应用和挂载，不初始化路由
  // 路由初始化由 adapter.qiankun.ts 在 token 初始化之后调用
  // 只要 render 收到 container，就一定来自 qiankun mount（集成模式）
  if (container || isIntegrateMode()) {
    if ((import.meta.env as any).DEV) {
      console.log('[render] 集成模式，只创建应用和挂载，路由初始化将在 token 初始化后完成');
    }

    // 先使用空路由初始化，只包含系统路由
    router = initRouter([]);
    app.use(router);
    // app.mount(mountContainer);

    // 路由初始化将在 adapter.qiankun.ts 的 mount 方法中，token 初始化之后完成
    // 返回必要工具，让 mount 生命周期钩子接管后续
    return { app, mountContainer };
  }

  // 独立运行模式：完成完整的初始化包括路由
  try {
    // 初始化路由（从资源接口加载）
    await initRouterFromResources();

    app.use(router!);

    // 挂载应用
    app.mount(mountContainer);

    // 处理路由首次跳转
    await handleInitialRoute(initialRoute);
  } catch (error) {
    console.error('[render] 独立模式初始化失败:', error);
    throw error;
  }

  return { app, mountContainer };
}

/**
 * qiankun 生命周期函数
 */
registerQiankunLifecycle({
  render,
  getApp: () => app,
  setApp: (value) => {
    app = value;
  },
  getRouter: () => router,
  setRouter: (value) => {
    router = value;
  },
});

// 独立运行模式：直接渲染
if (!isIntegrateMode()) {
  if (!env.VITE_APPLICATION_CODE) {
    console.error('[main] 独立运行模式，VITE_APPLICATION_CODE 未配置，无法加载路由');
    throw new Error('VITE_APPLICATION_CODE 未配置，请在环境变量中配置应用编码');
  }

  if ((import.meta.env as any).DEV) {
    console.log('[main] 独立运行模式，应用编码:', env.VITE_APPLICATION_CODE);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      render().catch(err => {
        console.error('[main] 独立运行模式渲染失败:', err);
      });
    });
  } else {
    render().catch(err => {
      console.error('[main] 独立运行模式渲染失败:', err);
    });
  }
}