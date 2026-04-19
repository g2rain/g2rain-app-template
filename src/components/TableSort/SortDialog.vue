<template>
  <!-- 排序配置弹窗 -->
  <el-dialog
      :model-value="sortDialogVisible"
      title="排序配置"
      width="500px"
      destroy-on-close
      @update:model-value="handleDialogVisibleChange"
  >
    <div class="sort-config">
      <!-- 已配置的排序项 -->
      <div v-if="sortConfig.length > 0" class="sort-list">
        <div
            v-for="(item, index) in sortConfig"
            :key="item.prop"
            class="sort-item"
        >
          <el-row :gutter="10" align="middle">
            <el-col :span="8">
              <div class="sort-label">
                {{ getColumnLabel(item.prop) }}
              </div>
            </el-col>
            <el-col :span="8">
              <el-select
                  v-model="item.order"
                  placeholder="选择排序方式"
                  size="small"
                  @change="handleSortChange"
              >
                <el-option label="升序" value="ascending" />
                <el-option label="降序" value="descending" />
              </el-select>
            </el-col>
            <el-col :span="8">
              <div class="sort-actions">
                <el-button
                    type="danger"
                    link
                    size="small"
                    @click="removeSort(index)"
                >
                  删除
                </el-button>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 添加排序 -->
      <div class="add-sort">
        <el-row :gutter="10" align="middle">
          <el-col :span="12">
            <el-select
                v-model="newSort.prop"
                placeholder="选择列"
                size="small"
                filterable
            >
              <el-option
                  v-for="column in sortableColumns"
                  :key="column.prop"
                  :label="column.label"
                  :value="column.prop"
              />
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-select
                v-model="newSort.order"
                placeholder="排序方式"
                size="small"
            >
              <el-option label="升序" value="ascending" />
              <el-option label="降序" value="descending" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-button type="primary" size="small" @click="addSort">
              添加
            </el-button>
          </el-col>
        </el-row>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="applySortConfig">应用</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 排序触发按钮（放置在操作列中） -->
  <template v-if="props.showInActionColumn">
    <el-button
        type="primary"
        link
        size="small"
        @click="openSortConfig"
    >
      排序配置
    </el-button>
  </template>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import type { SortItem, SortColumn } from './useTableSort';

interface Props {
  // 表格列配置
  columns: SortColumn[];
  // 当前排序配置
  modelValue?: SortItem[];
  // 是否在操作列中显示
  showInActionColumn?: boolean;
  // 是否显示排序配置弹窗
  visible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showInActionColumn: true,
  visible: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: SortItem[]];
  'sort-change': [value: SortItem[]];
  'update:visible': [value: boolean];
}>();

// 弹窗显示状态
const sortDialogVisible = ref(props.visible);

// 新的排序配置
const newSort = reactive<SortItem>({
  prop: '',
  order: 'ascending',
});

// 当前排序配置
const sortConfig = ref<SortItem[]>(props.modelValue || []);

// 可排序的列
const sortableColumns = computed(() => {
  return props.columns.filter(col => col.sortable !== false);
});

// 获取列标签
const getColumnLabel = (prop: string) => {
  const column = props.columns.find(col => col.prop === prop);
  return column?.label || prop;
};

// 打开排序配置弹窗
const openSortConfig = () => {
  // 打开对话框时，同步最新的排序配置
  if (props.modelValue) {
    sortConfig.value = [...props.modelValue];
  } else {
    sortConfig.value = [];
  }
  sortDialogVisible.value = true;
  emit('update:visible', true);
};

// 添加排序
const addSort = () => {
  if (!newSort.prop) {
    return;
  }

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

// 处理排序变化
const handleSortChange = () => {
  // 可以在这里触发排序变更事件
};

// 处理对话框显示状态变化
const handleDialogVisibleChange = (visible: boolean) => {
  sortDialogVisible.value = visible;
  emit('update:visible', visible);
  
  // 当对话框打开时，同步最新的排序配置
  if (visible) {
    if (props.modelValue) {
      sortConfig.value = [...props.modelValue];
    } else {
      sortConfig.value = [];
    }
  }
};

// 取消操作
const handleCancel = () => {
  // 恢复原始配置
  if (props.modelValue) {
    sortConfig.value = [...props.modelValue];
  } else {
    sortConfig.value = [];
  }
  sortDialogVisible.value = false;
  emit('update:visible', false);
};

// 应用排序配置
const applySortConfig = () => {
  emit('update:modelValue', [...sortConfig.value]);
  emit('sort-change', [...sortConfig.value]);
  sortDialogVisible.value = false;
  emit('update:visible', false);
};

// 监听props变化
watch(
    () => props.visible,
    (val) => {
      sortDialogVisible.value = val;
      // 当对话框打开时，同步最新的排序配置
      if (val) {
        if (props.modelValue) {
          sortConfig.value = [...props.modelValue];
        } else {
          sortConfig.value = [];
        }
      }
    }
);

watch(
    () => props.modelValue,
    (val) => {
      // 只在对话框关闭时同步，避免在编辑过程中被覆盖
      if (!sortDialogVisible.value) {
        if (val) {
          sortConfig.value = [...val];
        } else {
          sortConfig.value = [];
        }
      }
    }
);

// 暴露方法给父组件
defineExpose({
  openSortConfig,
});
</script>

<style scoped>
.sort-config {
  padding: 10px 0;
}

.sort-list {
  margin-bottom: 20px;
}

.sort-item {
  padding: 8px;
  margin-bottom: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.sort-label {
  line-height: 32px;
  font-size: 14px;
  color: #606266;
}

.sort-actions {
  text-align: right;
}

.add-sort {
  padding-top: 10px;
  border-top: 1px solid #e4e7ed;
}
</style>

