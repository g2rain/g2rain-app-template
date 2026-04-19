import { ref, reactive, computed, watch } from 'vue';
import type { Ref } from 'vue';

export interface SortItem {
    prop: string;
    order: 'ascending' | 'descending';
}

export interface SortColumn {
    prop: string;
    label: string;
    sortable?: boolean;
}

/**
 * 表格排序组合式函数
 * @param columns 列配置
 * @param initialSort 初始排序配置
 */
export function useTableSort(
    columns: SortColumn[],
    initialSort: SortItem[] = []
) {
    // 排序配置
    const sortConfig = ref<SortItem[]>(initialSort);

    // 排序弹窗显示状态
    const sortDialogVisible = ref(false);

    // 新的排序项
    const newSort = reactive<SortItem>({
        prop: '',
        order: 'ascending',
    });

    // 可排序的列
    const sortableColumns = computed(() => {
        return columns.filter(col => col.sortable !== false);
    });

    // 获取列标签
    const getColumnLabel = (prop: string) => {
        const column = columns.find(col => col.prop === prop);
        return column?.label || prop;
    };

    // 添加排序
    const addSort = () => {
        if (!newSort.prop) return;

        // 检查是否已存在相同的排序项
        const exists = sortConfig.value.some(item => item.prop === newSort.prop);
        if (!exists) {
            sortConfig.value.push({ ...newSort });
            newSort.prop = '';
            newSort.order = 'ascending';
        }
    };

    // 删除排序
    const removeSort = (index: number) => {
        sortConfig.value.splice(index, 1);
    };

    // 打开排序配置
    const openSortConfig = () => {
        sortDialogVisible.value = true;
    };

    // 关闭排序配置
    const closeSortConfig = () => {
        sortDialogVisible.value = false;
    };

    // 应用排序配置
    const applySortConfig = () => {
        closeSortConfig();
        // 触发排序变更事件
        // 这里可以根据实际需求添加回调
    };

    // 清除所有排序
    const clearAllSort = () => {
        sortConfig.value = [];
    };

    // 切换排序顺序
    const toggleSortOrder = (prop: string) => {
        const index = sortConfig.value.findIndex(item => item.prop === prop);
        if (index > -1) {
            const item = sortConfig.value[index];
            item.order = item.order === 'ascending' ? 'descending' : 'ascending';
            sortConfig.value.splice(index, 1, { ...item });
        }
    };

    // 获取排序字符串（用于API请求）
    const getSortString = (): string => {
        return sortConfig.value
            .map(item => {
                const order = item.order === 'ascending' ? 'asc' : 'desc';
                return `${item.prop} ${order}`;
            })
            .join(',');
    };

    // 获取排序对象（用于API请求）
    const getSortObject = () => {
        return sortConfig.value.reduce((acc, item) => {
            const order = item.order === 'ascending' ? 'asc' : 'desc';
            acc[item.prop] = order;
            return acc;
        }, {} as Record<string, string>);
    };

    // 监听排序变化
    watch(
        () => sortConfig.value,
        (newVal) => {
            // 这里可以触发排序变化事件
            console.log('排序配置变化:', newVal);
        },
        { deep: true }
    );

    return {
        // 状态
        sortConfig,
        sortDialogVisible,
        newSort,
        sortableColumns,

        // 方法
        getColumnLabel,
        addSort,
        removeSort,
        openSortConfig,
        closeSortConfig,
        applySortConfig,
        clearAllSort,
        toggleSortOrder,
        getSortString,
        getSortObject,
    };
}

