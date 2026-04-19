<template>
  <div id="app">
    <!-- 使用默认的 router-view，不使用 v-slot -->
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { sso } from '@runtime/auth';
import { isIntegrateMode, emitRouteChange } from '@platform/apps';
import type { MicroAppProps } from '@platform/apps';

const router = useRouter();

onMounted(() => {
  // 集成模式下不监控 token 状态变化，由主应用统一管理
  if (!isIntegrateMode()) {
    sso.listenTokenChanges();
  }

  // 集成模式下监听路由变化并通知主应用
  if (isIntegrateMode()) {
    router.afterEach((to) => {
      // 获取主应用传递的 props
      const props = (window as any).__QIANKUN_PROPS__ as MicroAppProps | undefined;
      if (!props) {
        console.warn('[App] qiankun props 未找到，无法发送路由变化事件');
        return;
      }

      // 检查必要的字段
      if (!props.appKey || !props.activeRule) {
        console.warn('[App] qiankun props 缺少必要字段（appKey 或 activeRule），无法发送路由变化事件');
        return;
      }

      // 构建完整路径
      const routePath = to.path;
      const activeRule = props.activeRule;
      // 确保路径正确拼接（处理斜杠），避免出现双斜杠 //
      // const normalizedActiveRule = activeRule.endsWith('/')
      //   ? activeRule.slice(0, -1)
      //   : activeRule;
      // const normalizedRoutePath = routePath.startsWith('/')
      //   ? routePath
      //   : `/${routePath}`;
      const fullPath = `${activeRule}/${routePath}`.replace(/\/+/g, '/');

      // 发送路由变化事件给主应用
      emitRouteChange({
        appKey: props.appKey,
        activeRule: activeRule,
        routePath: routePath,
        fullPath: fullPath,
        timestamp: Date.now(),
      });

      console.log('[App] 路由变化，已通知主应用:', {
        appKey: props.appKey,
        activeRule: activeRule,
        routePath: routePath,
        fullPath: fullPath,
      });
    });
  }
});
</script>

<style scoped>
#app {
  min-height: 100%; /* 允许内容超出，由父容器处理滚动 */
  padding: 0;
}
</style>

