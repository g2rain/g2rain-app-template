# RemoteSelect 远程搜索选择组件

通用的远程搜索下拉选择组件，支持按名称（key）或 ID（value）进行搜索。

## 组件说明

### RemoteSelect

基础远程搜索选择组件，通过 `fetchData` 函数获取数据。

### ApiSelect

基于 `RemoteSelect` 的**通用简化封装**：只需要传入 `apiMethod` + `valueKey/labelKey`，即可快速切换为不同的数据下拉。

- 默认 **不允许空关键字请求**（避免拉全量）
- 默认 **不开启打开下拉预取**
- 适合大多数“按关键字搜索”的下拉场景

### StatusSwitch

状态开关组件，内置「状态切换 API 调用 + loading + 失败回滚 + 成功/失败消息」逻辑，适合表格状态列快速接入。

- 默认状态值：`ACTIVE` / `INACTIVE`
- 默认展示文案：`有效` / `无效`（未传 `options` 时）

### OrganSelect

基于 `RemoteSelect` 封装的机构选择组件，已配置好机构相关的 API 和字段映射。

默认使用 `@/views/organ/api` 的 `OrganApi.id2name`；若子应用目录结构一致可直接使用，否则请通过 `apiMethod` 注入自定义请求。

## 导入方式

在 `<script setup>` 中导入后，模板里可直接写标签名，**无需 `components` 注册**。

```ts
// 方式一：从组件总入口导入（推荐）
import { OrganSelect, ApiSelect, RemoteSelect } from '@/components';
import { StatusSwitch } from '@/components';

// 方式二：从 RemoteSelect 子模块导入
import { OrganSelect, ApiSelect, RemoteSelect } from '@/components/RemoteSelect';
import { StatusSwitch } from '@/components/RemoteSelect';
```

类型定义（自定义 `apiMethod` 时可用）：

```ts
import type { OrganIdNameMap } from '@/views/organ/type';
import type { FetchDataFunction } from '@/components/RemoteSelect';
```

## 使用方法

### OrganSelect 基础用法

```vue
<template>
  <el-form-item label="所属机构">
    <OrganSelect 
      v-model="queryForm.organId" 
      placeholder="请选择所属机构"
      width="200px"
    />
  </el-form-item>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { OrganSelect } from '@/components';

const queryForm = reactive({
  organId: undefined as number | undefined,
});
</script>
```

### 事件：change / clear

`OrganSelect` 的 `change` 会在内部把值规范为 `number | null | undefined` 再抛出。

```vue
<template>
  <OrganSelect
    v-model="organId"
    @change="onOrganChange"
    @clear="onOrganClear"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { OrganSelect } from '@/components';

const organId = ref<number | null>(null);

function onOrganChange(v: number | null | undefined) {
  console.log('机构 ID:', v);
}

function onOrganClear() {
  console.log('已清空');
}
</script>
```

### 自定义请求（apiMethod）

当默认 `OrganApi.id2name` 不满足需求时，传入与 `FetchDataFunction` 相同签名的方法即可：

```vue
<template>
  <OrganSelect v-model="organId" :api-method="fetchOrgans" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { OrganSelect } from '@/components';
import type { OrganIdNameMap } from '@/views/organ/type';

const organId = ref<number | null>(null);

async function fetchOrgans(params: {
  key?: string;
  value?: number;
}): Promise<OrganIdNameMap[]> {
  // 按项目实际 API 实现
  return [];
}
</script>
```

### RemoteSelect 自定义用法

```vue
<template>
  <RemoteSelect
    v-model="selectedValue"
    :fetch-data="fetchData"
    value-key="id"
    label-key="name"
    placeholder="请选择"
    width="200px"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { RemoteSelect, type FetchDataFunction } from '@/components';

const selectedValue = ref<number | null>(null);

const fetchData: FetchDataFunction = async (params) => {
  // params.key: 字符串查询（名称）
  // params.value: 数字查询（ID）
  
  if (params.value !== undefined) {
    // 按 ID 查询
    return await YourApi.getById(params.value);
  }
  
  if (params.key) {
    // 按名称查询
    return await YourApi.searchByName(params.key);
  }
  
  return [];
};
</script>
```

### ApiSelect（推荐：通用简化用法）

#### 1）默认模式：不预取、不允许空关键字（不拉全量）

```vue
<template>
  <ApiSelect
    v-model="form.organId"
    :api-method="OrganApi.search"
    value-key="id"
    label-key="organName"
    placeholder="请输入关键字搜索机构"
    clearable
    width="200px"
  />
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { ApiSelect } from '@/components';
import { OrganApi } from '@/views/organ/api';

const form = reactive({
  organId: null as number | null,
});
</script>
```

#### 2）需要“打开就有默认列表”的场景（谨慎开启）

仅当你的 `apiMethod` 支持**空关键字分页/默认列表**时再开启：

```vue
<ApiSelect
  v-model="usageCode"
  :api-method="DictItemApi.select"
  value-key="code"
  label-key="name"
  :allow-empty-keyword="true"
  :prefetch-on-open="true"
  placeholder="请选择"
/>
```

### StatusSwitch（推荐：状态列封装）

```vue
<template>
  <StatusSwitch
    v-model="row.status"
    permission="application-authorization:status-update"
    :options="statusOptions"
    :api-method="({ nextValue }) => ApplicationAuthorizationApi.updateStatus(row.id, String(nextValue))"
  />
</template>
```

## Props

### RemoteSelect Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| modelValue | v-model 绑定值 | `number \| string \| null` | - |
| fetchData | 数据获取函数 | `FetchDataFunction` | - |
| valueKey | 值字段名 | `string` | `'value'` |
| labelKey | 标签字段名 | `string` | `'label'` |
| placeholder | 占位符 | `string` | `'请选择'` |
| clearable | 是否可清空 | `boolean` | `true` |
| disabled | 是否禁用 | `boolean` | `false` |
| width | 宽度 | `string` | `'200px'` |
| debounceDelay | 防抖延迟（毫秒） | `number` | `300` |

### OrganSelect Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| modelValue | v-model 绑定值 | `number \| null` | - |
| apiMethod | 自定义 API 方法 | `(params: { key?: string; value?: number }) => Promise<OrganIdNameMap[]>` | 使用默认适配器 |
| valueKey | 值字段名 | `string` | `'organId'` |
| labelKey | 标签字段名 | `string` | `'organName'` |
| placeholder | 占位符 | `string` | `'请选择所属机构'` |
| clearable | 是否可清空 | `boolean` | `true` |
| disabled | 是否禁用 | `boolean` | `false` |
| width | 宽度 | `string` | `'200px'` |
| debounceDelay | 远程搜索防抖（毫秒） | `number` | `300` |

### ApiSelect Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| modelValue | v-model 绑定值 | `number \| string \| null` | - |
| apiMethod | API 方法（按 key/value 查询） | `(params: { key?: string; value?: number }) => Promise<any[]>` | - |
| valueKey | 值字段名 | `string` | `'id'` |
| labelKey | 标签字段名 | `string` | `'name'` |
| placeholder | 占位符 | `string` | `'请选择'` |
| clearable | 是否可清空 | `boolean` | `true` |
| disabled | 是否禁用 | `boolean` | `false` |
| width | 宽度 | `string` | `'200px'` |
| debounceDelay | 远程搜索防抖（毫秒） | `number` | `300` |
| allowEmptyKeyword | 是否允许空关键字请求（避免拉全量） | `boolean` | `false` |
| prefetchOnOpen | 打开下拉时预取空关键字数据 | `boolean` | `false` |

### StatusSwitch Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| modelValue | 当前状态值（v-model） | `string \| number \| boolean` | - |
| apiMethod | 状态切换请求方法（必填） | `(params: { nextValue; prevValue }) => Promise<void>` | - |
| activeValue | 激活值 | `string \| number \| boolean` | `'ACTIVE'` |
| inactiveValue | 非激活值 | `string \| number \| boolean` | `'INACTIVE'` |
| options | 状态值与文案映射 | `{ label: string; value: string \| number \| boolean }[]` | `[]` |
| permission | 页面元素权限编码（可选） | `string` | - |
| disabled | 是否禁用 | `boolean` | `false` |
| inlinePrompt | 是否显示开关文案 | `boolean` | `true` |
| successMessage | 成功提示文案 | `string` | `'更新成功'` |
| errorMessage | 失败提示文案 | `string` | `'更新失败'` |

## Events

### RemoteSelect

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| update:modelValue | 值变化时触发 | `value: number \| string \| null \| undefined` |
| change | 值变化时触发 | `value: number \| string \| null \| undefined` |
| clear | 清空时触发 | - |

### OrganSelect

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| update:modelValue | 值变化时触发 | `value: number \| null \| undefined` |
| change | 值变化时触发（字符串会尝试转为 number） | `value: number \| null \| undefined` |
| clear | 清空时触发 | - |

### ApiSelect

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| update:modelValue | 值变化时触发 | `value: number \| string \| null \| undefined` |
| change | 值变化时触发 | `value: number \| string \| null \| undefined` |
| clear | 清空时触发 | - |

### StatusSwitch

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| update:modelValue | 状态变化时触发（含回滚） | `value: string \| number \| boolean` |
| success | API 调用成功后触发 | `{ nextValue, prevValue }` |
| error | API 调用失败并回滚后触发 | `{ nextValue, prevValue, error }` |

## 特性

1. **智能查询**：
   - 输入纯数字时，使用 `value` 参数（ID 查询）
   - 输入文本时，使用 `key` 参数（名称查询）

2. **防抖优化**：默认 300ms 防抖，减少请求频率

3. **初始值回显**：组件挂载时自动加载初始值对应的选项

4. **接口解耦**：通过 `fetchData` 函数实现组件与 API 的解耦

5. **类型安全**：完整的 TypeScript 类型支持

## FetchDataFunction 接口

```typescript
type FetchDataFunction<T extends Record<string, any> = Record<string, any>> = (
  params: { key?: string; value?: number }
) => Promise<T[]>;
```

- `params.key`: 字符串查询参数（名称）
- `params.value`: 数字查询参数（ID）
