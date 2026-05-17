<template>
  <div id="app">
    <!-- 使用默认的 router-view，不使用 v-slot -->
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { sso } from '@runtime/auth';
import { isIntegrateMode } from '@shared/utils/mode.util';

onMounted(() => {
  // 集成模式下不监控 token 状态变化，由主应用统一管理
  if (!isIntegrateMode()) {
    sso.listenTokenChanges();
  }
});
</script>

<style scoped>
#app {
  min-height: 100%; /* 允许内容超出，由父容器处理滚动 */
  padding: 0;
}
</style>

