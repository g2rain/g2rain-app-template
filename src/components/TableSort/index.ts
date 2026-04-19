/**
 * 表格排序组件模块
 * 
 * 提供完整的表格多列排序解决方案
 */

// 导出组件
export { default as SortableTable } from './SortableTable.vue';
export { default as TableColumn } from './TableColumn.vue';
export { default as SortManagerButton } from './SortManagerButton.vue';
export { default as TableSortColumn } from './SortDialog.vue';

// 导出 composable 和类型
export { useTableSort } from './useTableSort';
export type { SortItem, SortColumn } from './useTableSort';

