<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { DetailNav, InfoCard } from "@/components";
import type { AbilityInfo } from "@/types";

const route = useRoute();
const router = useRouter();

const nameEn = computed(() => String(route.params.name));
const ability = ref<AbilityInfo | undefined>(undefined);

onMounted(async () => {
  const mod = await import("@/data/abilities/pokemon-abilities");
  ability.value = mod.ABILITY_DB[nameEn.value];
});

function goBack() {
  router.back();
}
</script>

<template>
  <div class="ability-page">
    <DetailNav :title="ability ? ability.nameZh : nameEn" @back="goBack" />

    <div class="ability-body">
      <InfoCard v-if="ability" title="特性">
        <div class="ability-head">
          <span class="ability-name-zh">{{ ability.nameZh }}</span>
          <span class="ability-name-en">{{ nameEn }}</span>
        </div>
        <p class="ability-desc">{{ ability.descZh || "暂无该特性的详细介绍。" }}</p>
        <p
          class="ability-desc"
          v-if="ability.intro && ability.intro !== ability.descZh"
        >
          {{ ability.intro }}
        </p>
        <p
          class="ability-desc ability-effect"
          v-if="ability.effectzh"
          style="white-space: pre-line"
        >
          {{ ability.effectzh }}
        </p>
      </InfoCard>
      <InfoCard v-else>
        <p class="no-data">未找到特性「{{ nameEn }}」的数据。</p>
      </InfoCard>
    </div>
  </div>
</template>

<style scoped>
.ability-page {
  min-height: calc(100vh - 56px - env(safe-area-inset-bottom, 0px) - 8px);
  background: var(--poke-cream);
  padding-bottom: 16px;
  box-sizing: border-box;
}

.ability-body {
  padding: 4px 12px;
}

.ability-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 12px;
}

.ability-name-zh {
  font-size: 20px;
  font-weight: 800;
  color: var(--poke-ink);
}

.ability-name-en {
  font-size: 13px;
  color: var(--poke-ink-3);
  font-style: italic;
}

.ability-desc {
  font-size: 14px;
  color: var(--poke-ink-2);
  line-height: 1.7;
}

.ability-effect {
  margin-top: 10px;
}
</style>
