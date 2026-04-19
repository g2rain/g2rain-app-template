# QueryForm 查询表单组件

一个通用的查询表单组件，用于构建列表页面的查询条件。提供基础的查询字段（ID、创建时间、更新时间）和排序功能，支持通过插槽扩展业务特定的查询字段。

## 功能特性

- ✅ 内置基础查询字段：ID、创建时间范围、更新时间范围
- ✅ 支持排序字段管理（通过 `updateSorts` 方法）
- ✅ 支持通过插槽扩展业务特定查询字段
- ✅ 支持自定义操作按钮（通过 `actions` 插槽）
- ✅ 自动国际化：根据浏览器语言自动选择 Element Plus 语言包
- ✅ 双向绑定：使用 `v-model` 绑定查询参数
- ✅ 表单重置功能
- ✅ 符合架构规范：不依赖 `platform` 层类型，保持 `components` 层独立性

## Props

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `modelValue` | `QueryFormData` | 是 | 查询表单数据，支持双向绑定 |

### QueryFormData 类型定义

```typescript
interface QueryFormData {
  id?: number;                    // ID
  createTime?: string[];          // 创建时间范围 [开始时间, 结束时间]，格式：'YYYY-MM-DD HH:mm:ss'
  updateTime?: string[];          // 更新时间范围 [开始时间, 结束时间]，格式：'YYYY-MM-DD HH:mm:ss'
  sorts?: string[];               // 排序字段数组，格式：['column1,asc', 'column2,desc']
}
```

**注意**：由于 TypeScript 的结构化类型系统，外部可以传入 `BaseSelectListDto` 或任何包含这些字段的类型，组件会自动兼容。

## Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `update:modelValue` | `value: QueryFormData` | 表单数据更新时触发 |
| `search` | - | 点击查询按钮时触发 |

## Slots

| 插槽名 | 说明 |
|--------|------|
| 默认插槽 | 用于添加业务特定的查询字段 |
| `actions` | 用于自定义操作按钮区域，默认提供"查询"和"重置"按钮 |

## 暴露的方法

通过 `ref` 可以调用以下方法：

| 方法名 | 参数 | 返回值 | 说明 |
|--------|------|--------|------|
| `updateSorts` | `sortParams: Record<string, string>` | `void` | 更新排序字段。参数格式：`{ column1: 'asc', column2: 'desc' }` |
| `reset` | - | `void` | 重置表单，清空所有查询条件并触发 `search` 事件 |

## 使用示例

### 基础用法

```vue
<template>
  <QueryForm v-model="queryForm" @search="handleSearch">
    <!-- 业务特定查询字段 -->
    <el-form-item label="应用名称">
      <el-input 
        v-model="queryForm.applicationName" 
        placeholder="请输入应用名称" 
        clearable 
        style="width: 200px" 
      />
    </el-form-item>
  </QueryForm>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { QueryForm } from '@/components/QueryForm';
import type { BaseSelectListDto } from '@platform/types/api.type';

// 可以使用 BaseSelectListDto（推荐，与后端 API 类型一致）
const queryForm = ref<BaseSelectListDto & { applicationName?: string }>({
  id: undefined,
  createTime: undefined,
  updateTime: undefined,
  sorts: undefined,
  applicationName: undefined,
});

const handleSearch = () => {
  // 执行查询逻辑
  console.log('查询参数：', queryForm.value);
};
</script>
```

### 自定义操作按钮

```vue
<template>
  <QueryForm v-model="queryForm" @search="handleSearch">
    <!-- 业务查询字段 -->
    <el-form-item label="应用名称">
      <el-input v-model="queryForm.applicationName" placeholder="请输入应用名称" clearable />
    </el-form-item>

    <!-- 自定义操作按钮 -->
    <template #actions>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button @click="handleExport">导出</el-button>
      </el-form-item>
    </template>
  </QueryForm>
</template>
```

### 与表格排序集成

```vue
<template>
  <div>
    <QueryForm ref="queryFormRef" v-model="queryForm" @search="handleSearch" />

    <SortableTable 
      :data="tableData" 
      @sort-change="handleSortChange"
    >
      <el-table-column prop="name" label="名称" :sortable="true" />
      <el-table-column prop="createTime" label="创建时间" :sortable="true" />
    </SortableTable>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { QueryForm } from '@/components/QueryForm';
import type { BaseSelectListDto } from '@platform/types/api.type';

const queryFormRef = ref<InstanceType<typeof QueryForm>>();
const queryForm = ref<BaseSelectListDto>({});

// 处理表格排序变化
const handleSortChange = (sortParams: Record<string, string>) => {
  // 将表格的排序参数同步到查询表单
  queryFormRef.value?.updateSorts(sortParams);
  // 触发查询
  handleSearch();
};

const handleSearch = () => {
  // 执行查询逻辑
  console.log('查询参数：', queryForm.value);
};
</script>
```

### 完整示例（包含业务字段）

```vue
<template>
  <el-card shadow="never">
    <QueryForm ref="queryFormRef" v-model="baseQueryForm" @search="handleSearch">
      <!-- 业务特定查询字段 -->
      <el-form-item label="所属机构">
        <el-select 
          v-model="queryForm.organId" 
          placeholder="请选择所属机构" 
          clearable 
          style="width: 200px"
        >
          <el-option 
            v-for="item in organOptions" 
            :key="item.value" 
            :label="item.label" 
            :value="item.value" 
          />
        </el-select>
      </el-form-item>

      <el-form-item label="应用类型">
        <el-select 
          v-model="queryForm.applicationType" 
          placeholder="请选择应用类型" 
          clearable 
          style="width: 200px"
        >
          <el-option 
            v-for="item in typeOptions" 
            :key="item.value" 
            :label="item.label" 
            :value="item.value" 
          />
        </el-select>
      </el-form-item>

      <el-form-item label="应用名称">
        <el-input 
          v-model="queryForm.applicationName" 
          placeholder="请输入应用名称" 
          clearable 
          style="width: 200px" 
        />
      </el-form-item>
    </QueryForm>
  </el-card>

  <SortableTable 
    :data="tableData" 
    @sort-change="handleSortChange"
  >
    <!-- 表格列定义 -->
  </SortableTable>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { QueryForm } from '@/components/QueryForm';
import type { BaseSelectListDto } from '@platform/types/api.type';

const queryFormRef = ref<InstanceType<typeof QueryForm>>();

// 基础查询表单（BaseSelectListDto）
const baseQueryForm = ref<BaseSelectListDto>({
  id: undefined,
  createTime: undefined,
  updateTime: undefined,
  sorts: undefined,
});

// 业务特定查询字段
const queryForm = ref({
  organId: undefined,
  applicationType: undefined,
  applicationName: undefined,
});

// 合并查询参数
const getQueryParams = () => {
  return {
    ...baseQueryForm.value,
    ...queryForm.value,
  };
};

const handleSearch = () => {
  const params = getQueryParams();
  console.log('查询参数：', params);
  // 执行查询逻辑
};

const handleSortChange = (sortParams: Record<string, string>) => {
  queryFormRef.value?.updateSorts(sortParams);
  handleSearch();
};
</script>
```

## 注意事项

1. **日期时间格式**：创建时间和更新时间使用 `YYYY-MM-DD HH:mm:ss` 格式，组件内部会自动处理日期选择器的值格式转换。`createTime` 和 `updateTime` 应为长度为 2 的字符串数组。

2. **排序字段格式**：`sorts` 数组中的每个元素格式为 `'column,direction'`，例如：`['name,asc', 'createTime,desc']`。

3. **表单重置**：调用 `reset()` 方法会清空所有基础查询字段（ID、创建时间、更新时间、排序），但不会清空通过插槽添加的业务字段，需要在父组件中手动处理。

4. **国际化**：组件会根据浏览器语言自动选择 Element Plus 语言包：
   - `zh-CN` → 简体中文
   - `zh-TW` / `zh-HK` / `zh-MO` → 繁体中文
   - `en-*` → 英文
   - 其他 → 默认简体中文

5. **响应式数据**：建议使用 `ref` 创建查询表单数据，确保双向绑定正常工作。

6. **类型兼容性**：虽然组件内部使用 `QueryFormData` 类型，但由于 TypeScript 的结构化类型系统，外部可以传入 `BaseSelectListDto` 或任何包含相同字段的类型，无需修改现有代码。

## 架构说明

本组件位于 `components` 层，符合架构规范：

- **无业务耦合**：不依赖 `platform` 层的类型定义，保持 `components` 层的独立性
- **类型安全**：内部定义 `QueryFormData` 接口，确保类型安全
- **向后兼容**：支持外部传入 `BaseSelectListDto` 等兼容类型，无需修改现有代码
- **可复用**：可在任意项目中使用，不依赖特定业务逻辑

## 类型定义

```typescript
// 组件内部类型（已导出，可直接使用）
export interface QueryFormData {
  id?: number;
  createTime?: string[];
  updateTime?: string[];
  sorts?: string[];
}

// 外部推荐使用（与后端 API 类型一致）
import type { BaseSelectListDto } from '@platform/types/api.type';
```

## 相关组件

- `SortableTable` - 支持排序的表格组件，可与 QueryForm 配合使用
