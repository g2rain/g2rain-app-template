<template>
  <div class="sortable-table-wrapper">
    <el-table
      ref="tableRef"
      v-bind="$attrs"
      @sort-change="handleTableSortChange"
    >
      <slot />
    </el-table>

    <!-- 自动注入排序管理组件 -->
    <TableSortColumn
      v-if="enableMultiSort"
      ref="sortColumnRef"
      :columns="registeredColumns"
      :model-value="sortConfig"
      :visible="sortDialogVisible"
      :show-in-action-column="false"
      @update:model-value="handleSortConfigChange"
      @sort-change="handleSortChange"
      @update:visible="sortDialogVisible = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, provide, watch, nextTick } from 'vue';
import TableSortColumn from './SortDialog.vue';
import { useTableSort } from './useTableSort';
import type { SortItem, SortColumn } from './useTableSort';

interface Props {
  /** 是否启用多列排序 */
  enableMultiSort?: boolean;
  /** 初始排序配置 */
  initialSort?: SortItem[];
}

const props = withDefaults(defineProps<Props>(), {
  enableMultiSort: true,
  initialSort: () => [],
});

const emit = defineEmits<{
  'sort-change': [sortParams: Record<string, string>];
}>();

const tableRef = ref();
const sortColumnRef = ref();

// 注册的列信息
const registeredColumns = ref<SortColumn[]>([]);

// 使用排序 composable（传入空数组，因为列是动态注册的）
const {
  sortConfig,
  sortDialogVisible,
  getSortObject,
  getSortString,
} = useTableSort([], props.initialSort);

// 提供注册列的上下文
const registerColumn = (column: SortColumn) => {
  const exists = registeredColumns.value.find(col => col.prop === column.prop);
  if (!exists) {
    registeredColumns.value.push(column);
  }
};

const unregisterColumn = (prop: string) => {
  const index = registeredColumns.value.findIndex(col => col.prop === prop);
  if (index > -1) {
    registeredColumns.value.splice(index, 1);
  }
};

// 提供上下文给子组件
provide('registerColumn', registerColumn);
provide('unregisterColumn', unregisterColumn);
provide('tableSort', {
  openSortConfig: () => {
    sortDialogVisible.value = true;
  },
  getSortParams: () => getSortObject(),
});

// 监听 registeredColumns 变化，更新 useTableSort
watch(
  registeredColumns,
  (newColumns) => {
    // 当列注册完成后，可以在这里做一些处理
  },
  { deep: true }
);

// 同步排序状态到表格列
const syncSortStateToTable = () => {
  nextTick(() => {
    if (!tableRef.value) return;
    
    const tableEl = tableRef.value.$el;
    if (!tableEl) return;
    
    // 获取表格实例的列配置
    const tableInstance = tableRef.value as any;
    const columns = tableInstance?.store?.states?.columns?.value || [];
    
    // 创建一个 prop 到排序项的映射
    const sortMap = new Map<string, SortItem>();
    sortConfig.value.forEach(item => {
      sortMap.set(item.prop, item);
    });
    
    // 更新每个列的排序状态
    columns.forEach((column: any) => {
      const prop = column.property || column.prop;
      if (!prop) return;
      
      const sortItem = sortMap.get(prop);
      
      // 更新列的排序状态（Element Plus 内部使用 order 属性）
      if (sortItem) {
        column.order = sortItem.order;
      } else {
        // 如果该列不在排序配置中，但之前有排序状态，需要清除
        // 注意：这里不能直接设置为 null，因为 el-table 可能会自动清除
        // 我们只在有排序配置时才更新
      }
    });
    
    // 强制更新表格视图
    tableInstance?.doLayout?.();
    
    // 同时通过 DOM 操作来确保排序图标正确显示
    const headerCells = Array.from(tableEl.querySelectorAll('.el-table__header th')) as HTMLElement[];
    
    registeredColumns.value.forEach((col) => {
      const sortItem = sortMap.get(col.prop);
      
      // 查找对应的表头单元格
      const headerCell = headerCells.find((cell) => {
        const columnKey = cell.getAttribute('data-column-key') || '';
        const cellText = cell.querySelector('.cell')?.textContent?.trim() || '';
        
        return columnKey === col.prop || cellText === col.label;
      });
      
      if (!headerCell) return;
      
      const sortIcon = headerCell.querySelector('.caret-wrapper') as HTMLElement;
      if (!sortIcon) return;
      
      // Element Plus 使用 is-ascending 和 is-descending 类来显示排序状态
      if (sortItem) {
        if (sortItem.order === 'ascending') {
          headerCell.classList.add('ascending');
          headerCell.classList.remove('descending');
        } else if (sortItem.order === 'descending') {
          headerCell.classList.add('descending');
          headerCell.classList.remove('ascending');
        }
      } else {
        headerCell.classList.remove('ascending', 'descending');
      }
    });
  });
};

// 监听 sortConfig 变化，同步排序状态
watch(
  sortConfig,
  () => {
    syncSortStateToTable();
  },
  { deep: true, immediate: true }
);

// 处理表格单列排序（Element Plus 原生）
const handleTableSortChange = ({ prop, order }: any) => {
  if (!order) {
    // 清除该列的排序
    const index = sortConfig.value.findIndex(item => item.prop === prop);
    if (index > -1) {
      sortConfig.value.splice(index, 1);
    }
  } else {
    // 添加或更新排序
    const index = sortConfig.value.findIndex(item => item.prop === prop);
    if (index > -1) {
      sortConfig.value[index].order = order;
    } else {
      sortConfig.value.push({ prop, order });
    }
  }
  emitSortChange();
  // 同步排序状态到表格
  syncSortStateToTable();
};

// 处理多列排序配置变化
const handleSortConfigChange = (config: SortItem[]) => {
  sortConfig.value = config;
  emitSortChange();
};

const handleSortChange = (config: SortItem[]) => {
  emitSortChange();
};

const emitSortChange = () => {
  emit('sort-change', getSortObject());
};

defineExpose({
  openSortConfig: () => sortColumnRef.value?.openSortConfig(),
  getSortParams: getSortObject,
  getSortString,
  tableRef,
});
</script>

<style scoped>
.sortable-table-wrapper {
  width: 100%;
}

/* 确保多列排序图标正确显示 */
:deep(.el-table__header th.ascending .caret-wrapper .sort-caret.ascending) {
  color: #409eff;
}

:deep(.el-table__header th.descending .caret-wrapper .sort-caret.descending) {
  color: #409eff;
}
</style>

