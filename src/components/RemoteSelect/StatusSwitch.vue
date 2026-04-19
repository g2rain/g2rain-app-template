<template>
  <el-switch
    v-if="isVisible"
    v-model="innerValue"
    :disabled="isDisabled"
    :loading="loading"
    :inline-prompt="inlinePrompt"
    :active-value="activeValue"
    :inactive-value="inactiveValue"
    :active-text="activeLabel"
    :inactive-text="inactiveLabel"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { PageElementPermission } from '@/components/permission';

type StatusValue = string | number | boolean;

interface StatusOption {
  label: string;
  value: StatusValue;
}

interface Props {
  modelValue: StatusValue;
  activeValue?: StatusValue;
  inactiveValue?: StatusValue;
  options?: StatusOption[];
  permission?: string;
  disabled?: boolean;
  inlinePrompt?: boolean;
  successMessage?: string;
  errorMessage?: string;
  apiMethod: (params: {
    nextValue: StatusValue;
    prevValue: StatusValue;
  }) => Promise<void>;
}

interface Emits {
  (e: 'update:modelValue', value: StatusValue): void;
  (e: 'success', payload: { nextValue: StatusValue; prevValue: StatusValue }): void;
  (e: 'error', payload: { nextValue: StatusValue; prevValue: StatusValue; error: unknown }): void;
}

const props = withDefaults(defineProps<Props>(), {
  activeValue: 'ACTIVE',
  inactiveValue: 'INACTIVE',
  disabled: false,
  inlinePrompt: true,
  successMessage: '更新成功',
  errorMessage: '更新失败',
});

const emit = defineEmits<Emits>();

const innerValue = ref<StatusValue>(props.modelValue);
const loading = ref(false);
const isRollingBack = ref(false);

const isVisible = computed(() => {
  if (!props.permission) return true;
  return PageElementPermission.isVisible(props.permission);
});

const isEnabledByPermission = computed(() => {
  if (!props.permission) return true;
  return PageElementPermission.isEnabled(props.permission);
});

const isDisabled = computed(() => props.disabled || loading.value || !isEnabledByPermission.value);

const activeLabel = computed(() => {
  const hit = props.options?.find((item) => item.value === props.activeValue);
  if (hit?.label) return hit.label;
  return props.activeValue === 'ACTIVE' ? '有效' : String(props.activeValue);
});

const inactiveLabel = computed(() => {
  const hit = props.options?.find((item) => item.value === props.inactiveValue);
  if (hit?.label) return hit.label;
  return props.inactiveValue === 'INACTIVE' ? '无效' : String(props.inactiveValue);
});

watch(
  () => props.modelValue,
  (newValue) => {
    innerValue.value = newValue;
  },
);

const handleChange = async (nextValue: StatusValue) => {
  if (isRollingBack.value) return;

  const prevValue = nextValue === props.activeValue ? props.inactiveValue : props.activeValue;
  emit('update:modelValue', nextValue);

  loading.value = true;
  try {
    await props.apiMethod({ nextValue, prevValue });
    if (props.successMessage) {
      ElMessage.success(props.successMessage);
    }
    emit('success', { nextValue, prevValue });
  } catch (error) {
    isRollingBack.value = true;
    innerValue.value = prevValue;
    emit('update:modelValue', prevValue);
    if (props.errorMessage) {
      ElMessage.error(props.errorMessage);
    }
    emit('error', { nextValue, prevValue, error });
  } finally {
    loading.value = false;
    isRollingBack.value = false;
  }
};
</script>
