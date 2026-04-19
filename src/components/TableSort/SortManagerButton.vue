<template>
  <el-button
    type="primary"
    link
    size="small"
    @click="handleClick"
    title="管理排序"
  >
    <el-icon><Sort /></el-icon>
    <span v-if="showLabel">排序</span>
  </el-button>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { Sort } from '@element-plus/icons-vue';

interface Props {
  /** 是否显示文字标签 */
  showLabel?: boolean;
}

withDefaults(defineProps<Props>(), {
  showLabel: false,
});

const tableSort = inject<{ openSortConfig: () => void }>('tableSort');

const handleClick = () => {
  tableSort?.openSortConfig();
};
</script>

