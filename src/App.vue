<template>
  <div id="app">
    <!-- 使用默认的 router-view，不使用 v-slot -->
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { sso } from '@runtime/auth';
import { isAloneMode } from '@shared/utils/mode.util';

onMounted(() => {
  // qiankun 集成运行时由主应用统一管理 token
  if (isAloneMode()) {
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

