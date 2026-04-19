<template>
  <div class="home-container">
    <el-card class="home-card">
      <template #header>
        <div class="card-header">
          <h2>欢迎使用子应用（模板）</h2>
          <el-tag :type="isMock ? 'warning' : 'success'" effect="dark">
            {{ isMock ? 'Mock 模式' : '生产模式' }}
          </el-tag>
        </div>
      </template>
      
      <el-alert
        v-if="isMock"
        title="当前使用 Mock 数据"
        type="warning"
        :closable="false"
        show-icon
        class="mock-alert"
      >
        <template #default>
          <p>当前环境已启用 Mock 数据模式，所有 API 请求将返回模拟数据。</p>
          <p>如需使用真实 API，请在 <code>.env</code> 文件中设置 <code>VITE_USE_MOCK=false</code></p>
        </template>
      </el-alert>
      
      <p>这是子应用的默认首页。</p>
      <el-divider />
      
      <!-- 自动展示的路由入口 -->
      <div v-if="homeRoutes.length > 0" class="routes-section">
        <h3>功能入口</h3>
        <div class="routes-grid">
          <el-card
            v-for="route in homeRoutes"
            :key="route.path"
            class="route-card"
            shadow="hover"
            @click="goToRoute(route.path)"
          >
            <div class="route-card-content">
              <el-icon class="route-icon"><Document /></el-icon>
              <div class="route-info">
                <div class="route-title">{{ route.title }}</div>
                <div class="route-path">{{ route.path }}</div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
      
      <div v-else class="empty-routes">
        <el-empty description="暂无可用功能入口" :image-size="100" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Document } from '@element-plus/icons-vue';
import { isMockEnabled } from '@shared/env';
import { getHomeRoutes } from './route-map';

const router = useRouter();
const isMock = isMockEnabled();

// 自动采集需要在 Home 展示的路由
const homeRoutes = computed(() => getHomeRoutes());

// 跳转到指定路由
const goToRoute = (path: string) => {
  router.push(path);
};
</script>

<style scoped>
.home-container {
  padding: 40px;
  display: flex;
  justify-content: center;
}

.home-card {
  max-width: 600px;
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
}

.mock-alert {
  margin-bottom: 20px;
}

.mock-alert :deep(.el-alert__content) {
  line-height: 1.6;
}

.mock-alert code {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.routes-section {
  margin-top: 20px;
}

.routes-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.routes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.route-card {
  cursor: pointer;
  transition: all 0.3s;
}

.route-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.route-card-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
}

.route-icon {
  font-size: 32px;
  color: #409eff;
  flex-shrink: 0;
}

.route-info {
  flex: 1;
  min-width: 0;
}

.route-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.route-path {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-routes {
  margin-top: 20px;
  padding: 40px 0;
}
</style>

