<script setup lang="ts">
import { WEATHER_DB } from '@/data/battle/pokemon-weather'
import CodexSearch from './CodexSearch.vue'
</script>

<template>
  <CodexSearch
    :db="WEATHER_DB"
    placeholder="搜索天气名称"
  />
</template>
