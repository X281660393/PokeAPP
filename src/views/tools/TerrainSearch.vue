<script setup lang="ts">
import { TERRAIN_DB } from '@/data/battle/pokemon-terrain'
import CodexSearch from './CodexSearch.vue'
</script>

<template>
  <CodexSearch
    :db="TERRAIN_DB"
    placeholder="搜索场地名称"
  />
</template>
