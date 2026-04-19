<template>
  <el-config-provider :locale="locale">
    <el-form :model="modelValue" :inline="true" class="query-form">

      <!-- ID -->
      <el-form-item label="ID">
        <el-input
          :model-value="modelValue.id"
          @update:model-value="onIdChange"
          placeholder="请输入ID"
          clearable
          style="width:200px"
        />
      </el-form-item>

      <!-- 创建时间 -->
      <el-form-item label="创建时间">
        <el-date-picker
          v-model="createTimeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width:400px"
          clearable
        />
      </el-form-item>

      <!-- 更新时间 -->
      <el-form-item label="更新时间">
        <el-date-picker
          v-model="updateTimeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width:400px"
          clearable
        />
      </el-form-item>

      <!-- 隐藏的 sorts 字段（调试用，可保留/删除） -->
      <el-form-item v-show="false">
        <el-input v-model="sortsString" />
      </el-form-item>

      <!-- 业务扩展 -->
      <slot />

      <!-- 操作 -->
      <slot name="actions">
        <el-form-item>
          <el-button type="primary" @click="$emit('search')">
            查询
          </el-button>
          <el-button @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </slot>

    </el-form>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElConfigProvider } from 'element-plus'

import zhCn from 'element-plus/es/locale/lang/zh-cn'
import zhTw from 'element-plus/es/locale/lang/zh-tw'
import en from 'element-plus/es/locale/lang/en'

/**
 * Query 数据结构
 */
export interface QueryFormData {
  id?: number
  createTime?: [string, string]
  updateTime?: [string, string]
  sorts?: string[]
  // 允许扩展字段（比如 organId、applicationName 等）
  [key: string]: any
}

interface Props {
  modelValue: QueryFormData
}

interface Emits {
  (e: 'update:modelValue', value: QueryFormData): void
  (e: 'search'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * 浏览器语言
 */
function getBrowserLocale() {
  const browserLang =
    navigator.language ||
    navigator.languages?.[0] ||
    'zh-CN'

  const [lang, region] =
    browserLang.toLowerCase().split('-')

  if (lang === 'zh') {
    if (['tw', 'hk', 'mo'].includes(region)) {
      return zhTw
    }
    return zhCn
  }

  if (lang === 'en') {
    return en
  }

  return zhCn
}

const locale = getBrowserLocale()

/**
 * 更新字段
 */
function updateField<K extends keyof QueryFormData>(
  key: K,
  value: QueryFormData[K]
) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value
  })
}

/**
 * ID 变化
 */
function onIdChange(v: string | number) {
  const value =
    v === '' || v === null || v === undefined
      ? undefined
      : Number(v)

  updateField('id', value)
}

/**
 * 时间范围 Hook
 */
function useTimeRange(
  field: 'createTime' | 'updateTime'
) {
  return computed<[string, string] | null>({
    get() {
      const value = props.modelValue[field]

      if (!value) {
        return null
      }

      // 返回拷贝，避免直接改 props
      return [...value]
    },
    set(v) {
      if (!v) {
        updateField(field, undefined as any)
        return
      }

      updateField(field, [...v] as any)
    }
  })
}

const createTimeRange = useTimeRange('createTime')
const updateTimeRange = useTimeRange('updateTime')

/**
 * sorts 字符串（用于隐藏 input，便于调试）
 */
const sortsString = computed({
  get: () => {
    if (!props.modelValue.sorts || props.modelValue.sorts.length === 0) {
      return ''
    }
    return props.modelValue.sorts.join('; ')
  },
  set: () => {
    // 只读，不处理设置
  }
})

/**
 * 更新排序
 *
 * {name:'asc',id:'desc'}
 *
 * -> ["name,asc","id,desc"]
 */
function updateSorts(
  sortParams: Record<string, string>
) {
  const sorts = Object
    .entries(sortParams)
    .filter(([k, v]) => k && v)
    .map(([k, v]) => {
      const dir =
        v.toLowerCase() === 'desc'
          ? 'desc'
          : 'asc'

      return `${k},${dir}`
    })

  updateField(
    'sorts',
    sorts.length ? sorts : undefined
  )
}

/**
 * Element Table 排序支持
 */
function updateSortFromTable(sort: any) {
  if (!sort?.prop || !sort?.order) {
    updateField('sorts', undefined as any)
    return
  }

  const dir =
    sort.order === 'descending'
      ? 'desc'
      : 'asc'

  updateField('sorts', [
    `${sort.prop},${dir}`
  ] as any)
}

/**
 * 重置
 */
function handleReset() {
  // 按你采纳的版本，这里重置为 {}，保留扩展字段的灵活性
  emit('update:modelValue', {})
  emit('search')
}

/**
 * 暴露方法
 */
defineExpose({
  updateSorts,
  updateSortFromTable,
  reset: handleReset
})
</script>

<style scoped>
.query-form {
  margin: 0;
}
</style>