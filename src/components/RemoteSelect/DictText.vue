<template>
  <span>{{ displayText }}</span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { RemoteSelectOption } from './types';

interface Props {
  /** 当前字典编码（支持 boolean/number，内部会转成 string 再查字典） */
  value?: string | number | boolean | null;
  /** 用途编码，用于限定字典范围 */
  usageCode?: string;
  /** API 方法（通常传 DictItemApi.select） */
  apiMethod: (params: {
    key?: string;
    code?: string;
    usageCode?: string;
  }) => Promise<RemoteSelectOption[]>;
  /** 值字段名，默认为 code */
  valueKey?: string;
  /** 标签字段名，默认为 name */
  labelKey?: string;
  /** 空值占位文本 */
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  valueKey: 'code',
  labelKey: 'name',
  placeholder: '-',
});

const label = ref('');

const displayText = computed(() => {
  if (label.value) {
    return label.value;
  }
  const raw = props.value;
  if (raw === null || raw === undefined || raw === '') {
    return props.placeholder;
  }
  return String(raw);
});

const loadLabel = async () => {
  const value = String(props.value ?? '').trim();
  if (!value) {
    label.value = '';
    return;
  }

  try {
    const usageCode = props.usageCode?.trim();
    // 回显按 code 精确查询；后端 DictionaryItemSelectDto 使用 code，而非 key
    const options = await props.apiMethod({
      code: value,
      ...(usageCode ? { usageCode } : {}),
    });
    const matched = options.find((item) => String(item[props.valueKey]) === value);
    label.value = matched ? String(matched[props.labelKey] || value) : value;
  } catch (error) {
    console.error('DictText loadLabel error:', error);
    label.value = value;
  }
};

watch(
  () => [props.value, props.usageCode],
  () => {
    void loadLabel();
  },
  { immediate: true },
);
</script>
