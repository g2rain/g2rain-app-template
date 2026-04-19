<template>
  <el-table-column
      v-bind="$attrs"
      :sortable="sortable"
      :sort-by="sortBy"
      :sort-orders="sortOrders"
  >
    <template v-if="$slots.default" #default="scope">
      <slot v-bind="scope" />
    </template>
    <template v-if="$slots.header" #header="scope">
      <slot name="header" v-bind="scope" />
    </template>
  </el-table-column>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, inject, getCurrentInstance } from 'vue';
import type { SortColumn } from './useTableSort';

interface Props {
  // 是否参与排序
  sortable?: boolean | 'custom';
  // 排序字段，默认为prop
  sortBy?: string | ((row: any) => any);
  // 排序顺序
  sortOrders?: Array<'ascending' | 'descending' | null>;
}

const props = withDefaults(defineProps<Props>(), {
  sortable: true,
  sortOrders: () => ['ascending', 'descending', null],
});

// 从父组件注入的注册函数（可选，用于自动注册到排序系统）
const registerColumn = inject<(column: SortColumn) => void>('registerColumn');
const unregisterColumn = inject<(prop: string) => void>('unregisterColumn');

// 获取 prop 和 label（从 $attrs 中获取）
const instance = getCurrentInstance();
const attrs = instance?.attrs || {};
const prop = (attrs.prop || props.sortBy) as string;
const label = (attrs.label || prop) as string;

// 自动注册列到排序系统（如果父组件提供了注册函数）
onMounted(() => {
  if (registerColumn && prop && props.sortable !== false) {
    // Convert 'custom' to true for SortColumn interface (sortable is boolean, not 'custom')
    const isSortable = props.sortable === 'custom' ? true : props.sortable as boolean;
    registerColumn({
      prop: typeof prop === 'string' ? prop : '',
      label: typeof label === 'string' ? label : prop || '',
      sortable: isSortable,
    });
  }
});

// 卸载时取消注册
onUnmounted(() => {
  if (unregisterColumn && prop && typeof prop === 'string') {
    unregisterColumn(prop);
  }
});

// 计算属性
const computedSortable = computed(() => {
  return props.sortable === false ? false : true;
});

// 暴露属性
defineExpose({
  sortable: computedSortable,
  sortBy: props.sortBy,
  sortOrders: props.sortOrders,
});
</script>

