<template>
  <div class="page">
    <!-- Hero -->
    <section class="hero stagger">
      <span class="hero-orb" aria-hidden="true"></span>
      <p class="eyebrow">DREAMWEAVE · 梦境续写</p>
      <h1 class="hero-title">
        记录你的梦，<br />
        让 AI 把它<span class="text-gradient">写成故事</span>。
      </h1>
      <p class="hero-sub">
        公开的梦，会被陌生人接着写下去。<br />
        这里是每个人潜意识交汇的广场。
      </p>
      <div class="hero-cta">
        <router-link to="/dreams/new" class="btn">✶ 记录一个梦</router-link>
        <button class="btn-ghost btn" :disabled="roaming" @click="roam">
          <span v-if="roaming" class="spinner"></span>🎲 随机漫游
        </button>
        <router-link to="/fragments/weave" class="btn-ghost btn">🧩 串联碎片</router-link>
      </div>
    </section>

    <!-- 广场 -->
    <section class="square">
      <div class="square-head">
        <h2>梦境广场</h2>
        <span class="square-count">{{ total }} 个公开的梦</span>
      </div>

      <!-- 搜索 + 筛选 -->
      <div v-reveal class="filters glass">
        <div class="search-row">
          <input
            v-model="q"
            class="search-input"
            placeholder="🔍 搜索梦境标题或内容…"
            @keyup.enter="applyFilters"
          />
          <button class="btn btn-sm" @click="applyFilters">搜索</button>
          <button v-if="hasFilter" class="btn-ghost btn-sm" @click="clearFilters">清除</button>
        </div>

        <div class="chip-row">
          <span class="chip-label">场景</span>
          <button
            v-for="s in tagsStore.scenes"
            :key="'s' + s.id"
            class="filter-chip"
            :class="{ active: scene === s.name }"
            @click="toggleScene(s.name)"
          >
            {{ s.name }}
          </button>
        </div>
        <div class="chip-row">
          <span class="chip-label">情感</span>
          <button
            v-for="e in tagsStore.emotions"
            :key="'e' + e.id"
            class="filter-chip filter-chip--emotion"
            :class="{ active: emotion === e.name }"
            @click="toggleEmotion(e.name)"
          >
            {{ e.name }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="grid stagger">
        <div v-for="n in 6" :key="n" class="skeleton glass"></div>
      </div>

      <div v-else-if="dreams.length" class="grid stagger">
        <DreamCard v-for="d in dreams" :key="d.id" :dream="d" />
      </div>

      <p v-else class="empty-state">
        {{ hasFilter ? '没有符合条件的梦境，换个关键词试试。' : '夜还很静，还没有人公开自己的梦……' }}
      </p>

      <div v-if="totalPages > 1" class="pagination">
        <button class="btn-ghost btn-sm" :disabled="page <= 1" @click="page--">← 上一页</button>
        <span class="page-num">{{ page }} / {{ totalPages }}</span>
        <button class="btn-ghost btn-sm" :disabled="page >= totalPages" @click="page++">下一页 →</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '../api/client';
import DreamCard from '../components/DreamCard.vue';
import { useTagsStore } from '../stores/tags';

const router = useRouter();
const tagsStore = useTagsStore();
const roaming = ref(false);

async function roam() {
  roaming.value = true;
  try {
    const r = await apiClient.get('/dreams/random');
    router.push(`/dreams/${r.data.id}`);
  } catch {
    /* 没有公开梦境时忽略 */
  } finally {
    roaming.value = false;
  }
}
const dreams = ref([]);
const page = ref(1);
const total = ref(0);
const totalPages = ref(1);
const loading = ref(true);

const q = ref('');
const scene = ref('');
const emotion = ref('');

const hasFilter = computed(() => !!(q.value || scene.value || emotion.value));

async function fetch() {
  loading.value = true;
  try {
    const r = await apiClient.get('/dreams', {
      params: {
        visibility: 'public',
        page: page.value,
        limit: 12,
        q: q.value || undefined,
        scene: scene.value || undefined,
        emotion: emotion.value || undefined,
      },
    });
    dreams.value = r.data.data;
    total.value = r.data.total;
    totalPages.value = Math.ceil(r.data.total / 12) || 1;
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  page.value = 1;
  fetch();
}
function toggleScene(name) {
  scene.value = scene.value === name ? '' : name;
  applyFilters();
}
function toggleEmotion(name) {
  emotion.value = emotion.value === name ? '' : name;
  applyFilters();
}
function clearFilters() {
  q.value = '';
  scene.value = '';
  emotion.value = '';
  applyFilters();
}

onMounted(() => {
  tagsStore.fetchTags();
  fetch();
});
watch(page, fetch);
</script>

<style scoped>
.hero {
  position: relative;
  text-align: center;
  padding: 40px 0 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}
/* Hero 背后缓慢呼吸的光球 */
.hero-orb {
  position: absolute;
  top: -40px;
  left: 50%;
  width: 280px;
  height: 280px;
  margin-left: -140px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(129, 140, 248, 0.35), rgba(94, 234, 212, 0.12) 45%, transparent 70%);
  filter: blur(20px);
  z-index: -1;
  animation: orb-breathe 8s var(--ease) infinite;
}
@keyframes orb-breathe {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.18); opacity: 1; }
}
.hero-title {
  margin-top: 8px;
}
.hero-sub {
  font-family: var(--font-serif);
  font-size: 1.1rem;
  line-height: 1.9;
  color: var(--mist);
  max-width: 540px;
}
.hero-cta {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 12px;
}

.square-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
}
.square-count {
  font-size: 0.85rem;
  color: var(--mist-dim);
  letter-spacing: 0.04em;
}

/* 筛选区 */
.filters {
  padding: 20px 22px;
  margin-bottom: 26px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.search-row {
  display: flex;
  gap: 10px;
}
.search-input {
  flex: 1;
}
.chip-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.chip-label {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--mist-dim);
  margin-right: 4px;
  flex-shrink: 0;
}
.filter-chip {
  font-size: 0.8rem;
  font-weight: 500;
  padding: 5px 13px;
  border-radius: 999px;
  color: var(--mist);
  background: rgba(60, 68, 120, 0.22);
  border: 1px solid var(--line);
  box-shadow: none;
}
.filter-chip:hover:not(.active) {
  transform: none;
  box-shadow: none;
  color: var(--aurora-teal);
  border-color: rgba(94, 234, 212, 0.4);
}
.filter-chip.active {
  color: var(--ink-on-light);
  background: linear-gradient(120deg, var(--aurora-teal), var(--aurora-indigo));
  border-color: transparent;
}
.filter-chip--emotion:hover:not(.active) {
  color: var(--dawn);
  border-color: rgba(255, 192, 159, 0.4);
}
.filter-chip--emotion.active {
  background: linear-gradient(120deg, var(--dawn), var(--dawn-deep));
  color: #2a1206;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 20px;
}
.skeleton {
  min-height: 200px;
  border-radius: var(--radius);
  background: linear-gradient(110deg, var(--surface) 30%, var(--surface-hi) 50%, var(--surface) 70%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 18px;
  margin-top: 40px;
}
.page-num {
  font-variant-numeric: tabular-nums;
  color: var(--mist);
  letter-spacing: 0.06em;
}
</style>
