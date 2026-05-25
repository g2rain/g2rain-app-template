<template>
  <RemoteSelect
    v-model="innerValue"
    :fetch-data="fetchData"
    :prefetch-on-open="Boolean(props.usageCode?.trim())"
    :value-key="valueKey"
    :label-key="labelKey"
    :placeholder="placeholder"
    :clearable="clearable"
    :disabled="disabled"
    :width="width"
    :debounce-delay="debounceDelay"
    @change="handleChange"
    @clear="$emit('clear')"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RemoteSelect } from './index';
import type { FetchDataFunction, RemoteSelectOption } from './types';

interface Props {
  /** 当前选择的字典项编码（code），只允许 string */
  modelValue?: string | null;
  /** 用途编码，用于获取对应字典列表 */
  usageCode?: string;
  /** API 方法（必填），内部由 DictSelect 负责将查询关键字映射为后端参数 */
  apiMethod: (params: {
    key?: string;
    value?: number;
    usageCode?: string;
  }) => Promise<RemoteSelectOption[]>;
  /** 值字段名，默认为 'code' */
  valueKey?: string;
  /** 标签字段名，默认为 'name' */
  labelKey?: string;
  /** 占位符 */
  placeholder?: string;
  /** 是否可清空 */
  clearable?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 宽度 */
  width?: string;
  /** 远程搜索防抖延迟（毫秒），与 RemoteSelect 一致 */
  debounceDelay?: number;
}

interface Emits {
  (e: 'update:modelValue', value: string | null | undefined): void;
  (e: 'change', value: string | null | undefined): void;
  (e: 'clear'): void;
}

const props = withDefaults(defineProps<Props>(), {
  valueKey: 'code',
  labelKey: 'name',
  placeholder: '请选择字典项',
  clearable: true,
  disabled: false,
  width: '200px',
  debounceDelay: 300,
});

const emit = defineEmits<Emits>();

// 使用本地可写的 ref 作为 v-model 绑定目标
const innerValue = computed({
  get: () => props.modelValue,
  set: (value: string | number | null | undefined) => {
    const next = typeof value === 'string' ? value : value === null || value === undefined ? value : String(value);
    emit('update:modelValue', next);
  },
});

/**
 * 处理值变化事件：DictSelect 的 v-model 只维护 string（code）
 */
const handleChange = (value: number | string | null | undefined) => {
  const next = typeof value === 'string' ? value : value === null || value === undefined ? value : String(value);
  emit('change', next);
};

/**
 * 根据属性初始化 fetchData 函数
 * 实现接口：FetchDataFunction<RemoteSelectOption>
 */
const fetchData: FetchDataFunction<RemoteSelectOption> = async (params: { key?: string; value?: number }): Promise<RemoteSelectOption[]> => {
  // 仅根据 name 查询关键字：
  // - RemoteSelect 的远程搜索输入为非数字 => params.key
  // - 若输入为数字 => RemoteSelect 会把它放到 params.value，我们也当作“name 关键字”转换成 string
  const keyword = params.key?.trim() || (params.value !== undefined && params.value !== null ? String(params.value) : '');
  const usageCode = props.usageCode?.trim();

  // 没有用途编码时，仍要求有关键字（避免无范围的全量字典拉取）
  if (!usageCode && !keyword) {
    return [];
  }

  try {
    // 不再传 value（避免按 ID 查询）
    return await props.apiMethod({
      ...(keyword ? { key: keyword } : {}),
      ...(usageCode ? { usageCode } : {}),
    });
  } catch (error) {
    console.error('DictSelect fetchData error:', error);
    return [];
  }
};
</script>

