<template>
  <RemoteSelect
    v-model="innerValue"
    :fetch-data="fetchData"
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
  modelValue?: number | null;
  /** API 方法（必填），接受包含 key 和 value 的参数对象 */
  apiMethod: (params: { key?: string; value?: number }) => Promise<RemoteSelectOption[]>;
  /** 值字段名，默认为 'organId' */
  valueKey?: string;
  /** 标签字段名，默认为 'organName' */
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
  (e: 'update:modelValue', value: number | null | undefined): void;
  (e: 'change', value: number | null | undefined): void;
  (e: 'clear'): void;
}

const props = withDefaults(defineProps<Props>(), {
  valueKey: 'organId',
  labelKey: 'organName',
  placeholder: '请选择所属机构',
  clearable: true,
  disabled: false,
  width: '200px',
  debounceDelay: 300,
});

const emit = defineEmits<Emits>();

// 使用本地可写的 ref 作为 v-model 绑定目标
const innerValue = computed({
  get: () => props.modelValue,
  set: (value: number | null | undefined) => {
    emit('update:modelValue', value);
  },
});

/**
 * 处理值变化事件，将值转换为 number 类型
 */
const handleChange = (value: number | string | null | undefined) => {
  // 将值转换为 number 类型（机构 ID 应该是数字）
  const numValue = typeof value === 'string' ? Number(value) : value;
  emit('change', numValue);
};

/**
 * 根据属性初始化 fetchData 函数
 * 实现接口：FetchDataFunction<RemoteSelectOption>
 */
const fetchData: FetchDataFunction<RemoteSelectOption> = async (
  params: { key?: string; value?: number }
): Promise<RemoteSelectOption[]> => {
  if ((!params.key || params.key === '') && (params.value === undefined || params.value === null)) {
    return [];
  }

  try {
    return await props.apiMethod(params);
  } catch (error) {
    console.error('OrganSelect fetchData error:', error);
    return [];
  }
};
</script>
