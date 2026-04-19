<template>
  <RemoteSelect
    v-model="innerValue"
    :fetch-data="fetchData"
    :prefetch-on-open="prefetchOnOpen"
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
  /** 选中值 */
  modelValue?: number | string | null;
  /**
   * API 方法（必填）
   * - params.key: 文本关键字
   * - params.value: 纯数字输入（RemoteSelect 会作为 value 传入）
   */
  apiMethod: (params: { key?: string; value?: number }) => Promise<any[]>;
  /** 值字段名（从返回项取值），默认 'id' */
  valueKey?: string;
  /** 标签字段名（从返回项取展示），默认 'name' */
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
  /**
   * 是否允许空关键字请求
   * - 默认 false：避免打开/选中后触发空串造成“拉全量”
   */
  allowEmptyKeyword?: boolean;
  /**
   * 是否打开下拉时预取一次空关键字数据
   * - 默认 false：避免“打开即加载”
   */
  prefetchOnOpen?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: number | string | null | undefined): void;
  (e: 'change', value: number | string | null | undefined): void;
  (e: 'clear'): void;
}

const props = withDefaults(defineProps<Props>(), {
  valueKey: 'id',
  labelKey: 'name',
  placeholder: '请选择',
  clearable: true,
  disabled: false,
  width: '200px',
  debounceDelay: 300,
  allowEmptyKeyword: false,
  prefetchOnOpen: false,
});

const emit = defineEmits<Emits>();

const innerValue = computed({
  get: () => props.modelValue,
  set: (value: number | string | null | undefined) => {
    emit('update:modelValue', value);
  },
});

const handleChange = (value: number | string | null | undefined) => {
  emit('change', value);
};

const fetchData: FetchDataFunction<RemoteSelectOption> = async (
  params: { key?: string; value?: number },
): Promise<RemoteSelectOption[]> => {
  const keyword = params.key?.trim() || '';
  const hasValue = params.value !== undefined && params.value !== null;

  if (!props.allowEmptyKeyword && !keyword && !hasValue) {
    return [];
  }

  try {
    const list = await props.apiMethod({
      ...(keyword ? { key: keyword } : {}),
      ...(hasValue ? { value: params.value } : {}),
    });

    return (list || []).map((item: any) => ({
      [props.valueKey]: item?.[props.valueKey],
      [props.labelKey]: item?.[props.labelKey] ?? String(item?.[props.valueKey] ?? ''),
    }));
  } catch (error) {
    console.error('ApiSelect fetchData error:', error);
    return [];
  }
};

const prefetchOnOpen = computed(() => Boolean(props.prefetchOnOpen && props.allowEmptyKeyword));
</script>

