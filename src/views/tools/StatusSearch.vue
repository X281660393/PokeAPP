<script setup lang="ts">
import { STATUS_DB } from '@/data/battle/pokemon-status'
import CodexSearch from './CodexSearch.vue'
</script>

<template>
  <CodexSearch
    :db="STATUS_DB"
    placeholder="搜索异常状态名称"
  />
</template>
