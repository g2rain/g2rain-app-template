/**
 * Qiankun 子应用事件适配器实现
 * 依赖基于 window 事件总线的通用适配器能力
 */

import type { MicroAppProps } from './types';
import { WindowEventSubAppEventAdapter } from '@/components/micro-app/event-windows-adapter';
import { renderWithQiankun } from 'vite-plugin-qiankun/dist/helper';
import { env } from '@shared/env';
import { initTokenFromProps } from './init';
import { type App as VueApp } from 'vue';
import { updateHttpBaseURLFromProps } from '@/components/http';
import { initMicroAppMessageHandlers } from './message-handlers';

// WindowEventSubAppEventAdapter 直接复用 components/micro-app 中的实现

/**
 * Qiankun 子应用事件适配器
 * 目前直接复用基于 window 事件的通用实现
 * 未来如需增加 qiankun 特有能力，可在此类中扩展
 */
export class QiankunSubAppEventAdapter extends WindowEventSubAppEventAdapter { }

// 单例事件适配器，用于在生命周期中派发子应用事件（例如路由变化）
const qiankunEventAdapter = new QiankunSubAppEventAdapter();

/**
 * qiankun 生命周期上下文
 * 由应用入口（main.ts）传入具体实现，避免适配器直接依赖 Vue 细节
 */
export interface QiankunLifecycleContext {
  render: (container?: HTMLElement, initialRoute?: string) => Promise<{ app: VueApp; mountContainer: HTMLElement }>;
  getApp: () => any | null;
  setApp: (app: any | null) => void;
  getRouter: () => any | null;
  setRouter: (router: any | null) => void;
}

/**
 * 注册 qiankun 子应用生命周期
 * 使用 renderWithQiankun 统一注册 bootstrap/mount/unmount/update
 */
export function registerQiankunLifecycle(ctx: QiankunLifecycleContext): void {
  // 初始化子应用侧的消息处理器，将 TOKEN_RESPONSE 事件绑定到 TokenResponseDataHandler
  qiankunEventAdapter.initEventListeners();
  initMicroAppMessageHandlers(qiankunEventAdapter.getMessageProcessor());
  renderWithQiankun({
    async bootstrap() {
      if ((import.meta.env as any).DEV) {
        console.log('[qiankun] 子应用启动');
      }
      return Promise.resolve();
    },

    async mount(props: MicroAppProps) {
      if (!props.container) {
        throw new Error('qiankun mount: container 未提供');
      }

      // 兜底：部分运行环境下 __POWERED_BY_QIANKUN__ 可能未被正确注入，
      // 但只要进入 mount 生命周期，就一定处于 qiankun 集成模式。
      (window as any).__POWERED_BY_QIANKUN__ = true;

      if ((import.meta.env as any).DEV) {
        console.log('[qiankun] mount props:', {
          initialRoute: props.initialRoute,
          container: props.container,
          applicationCode: env.VITE_APPLICATION_CODE,
          appKey: props.appKey,
          activeRule: props.activeRule,
          entryOrigin:  props.entryOrigin,
        });
      }
      // 保存 props 到全局变量，供 App.vue 中的路由监听使用
      (window as any).__QIANKUN_PROPS__ = props;

      // 先渲染应用（这会初始化 Vue 应用和 Pinia，但不初始化路由）
      const { app, mountContainer } = await ctx.render(props.container, props.initialRoute);

      updateHttpBaseURLFromProps();

      // 等待应用挂载完成，确保 Pinia 已初始化
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 在 Pinia 初始化后，先初始化 token（必须在路由初始化之前）
      await initTokenFromProps(props);

      // Token 初始化完成后，再初始化路由（从资源接口加载，需要 token）
      try {
        const { initRouterFromResources } = await import('@/main');
        await initRouterFromResources();

        // 获取更新后的路由实例
        const router = ctx.getRouter();

        if (router && props.appKey && props.activeRule) {
          router.afterEach((to: any, from: any) => {
            const routePath: string = to.path;
            const activeRule = props.activeRule as string;
            // 确保路径拼接正确
            const fullPath = `/${activeRule}/${routePath}`.replace(/\/{2,}/g, '/');

            qiankunEventAdapter.emitEvent({
              type: 'g2rain:sub-app:route-change',
              data: {
                appKey: props.appKey as string,
                activeRule,
                routePath,
                fullPath,
              },
              timestamp: Date.now(),
            } as any);

            if ((import.meta.env as any).DEV) {
              console.log('[qiankun] 子应用路由变化，已通知主应用:', {
                appKey: props.appKey,
                activeRule,
                routePath,
                fullPath,
              });
            }
          });
        }

        // 处理路由首次跳转
        if (router && props.initialRoute) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          try {
            const resolvedRoute = router.resolve(props.initialRoute);
            if (resolvedRoute.matched.length > 0) {
              await router.replace(props.initialRoute);
              if ((import.meta.env as any).DEV) {
                console.log('[qiankun] 已跳转到初始路由:', props.initialRoute);
              }
            }
          } catch (err) {
            console.error('[qiankun] 初始路由跳转失败:', err);
          }
        }
      } catch (error) {
        console.error('[qiankun] 路由初始化失败:', error);
        // 即使路由初始化失败，也不阻止应用挂载
      }

      // 5. 最后执行真正的 DOM 挂载
      // 此时 Router 内部的 Matcher 已经有值，且 currentRoute 已经指向 initialRoute
      app.mount(mountContainer);
      ctx.setApp(app); // 记录 app 实例用于 unmount
    },

    async unmount() {
      const app = ctx.getApp();
      if (app) {
        app.unmount();
        ctx.setApp(null);
      }

      const router = ctx.getRouter();
      if (router) {
        const { resetRouter } = await import('@runtime/router');
        resetRouter();
        ctx.setRouter(null);
      }
    },

    async update(props: MicroAppProps) {
      // 更新 token
      if (props.token && props.tokenKid) {
        await initTokenFromProps(props);
      }

      // 更新路由（从资源接口重新加载）
      const router = ctx.getRouter();
      if (router && env.VITE_APPLICATION_CODE) {
        try {
          const { initRoutesFromResources } = await import('@runtime/boot');
          const { updateRouter } = await import('@runtime/router');
          const resourceRoutes = await initRoutesFromResources();
          updateRouter(resourceRoutes);
        } catch (error) {
          console.error('[qiankun] 路由更新失败:', error);
        }
      }
    },
  });
}


