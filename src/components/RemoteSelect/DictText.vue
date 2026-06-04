<template>
  <span>{{ displayText }}</span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useLocaleStore } from '@platform/stores/locale.store';
import { parseDictCodeAsBoolean } from '@/views/dict/api';
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
  const raw = props.value;
  if (raw === null || raw === undefined || raw === '') {
    label.value = '';
    return;
  }

  const usageCode = props.usageCode?.trim();

  try {
    // 布尔字段（如 canIntegrate）：只拉 usageCode 全量并在内存匹配，避免 code=true 与字典 code=1 不一致导致二次请求
    if (typeof raw === 'boolean' && usageCode) {
      const options = await props.apiMethod({ usageCode });
      const matched = options.find(
        (item) => parseDictCodeAsBoolean(String(item[props.valueKey] ?? item.code ?? '')) === raw,
      );
      label.value = matched ? String(matched[props.labelKey] ?? raw) : String(raw);
      return;
    }

    const value = String(raw).trim();
    const options = await props.apiMethod({
      code: value,
      ...(usageCode ? { usageCode } : {}),
    });
    const matched = options.find((item) => String(item[props.valueKey]) === value);
    label.value = matched ? String(matched[props.labelKey] || value) : value;
  } catch (error) {
    console.error('DictText loadLabel error:', error);
    label.value = String(raw);
  }
};

const localeStore = useLocaleStore();

watch(
  () => [props.value, props.usageCode, localeStore.locale],
  () => {
    void loadLabel();
  },
  { immediate: true },
);
</script>
