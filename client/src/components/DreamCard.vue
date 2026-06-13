<template>
  <article
    ref="cardEl"
    class="dream-card glass"
    @click="$router.push(`/dreams/${dream.id}`)"
    @pointermove="onMove"
    @pointerleave="onLeave"
  >
    <div class="card-glow" aria-hidden="true"></div>

    <header class="card-top">
      <span class="vis" :class="dream.visibility === 'public' ? 'vis--pub' : 'vis--priv'">
        {{ dream.visibility === 'public' ? '◇ 公开' : '◆ 私有' }}
      </span>
      <span v-if="dream.ai_story" class="ai-flag">✦ AI 已续写</span>
    </header>

    <h3 class="card-title">{{ dream.title || '无题之梦' }}</h3>
    <p class="card-preview">{{ preview }}</p>

    <div v-if="scenes.length || emotions.length" class="card-tags">
      <span v-for="s in scenes.slice(0, 3)" :key="s" class="chip chip--scene">{{ s }}</span>
      <span v-if="emotions.length" class="emotion-dots" :title="emotions.map((e) => e.name).join('、')">
        <i v-for="(e, i) in emotions.slice(0, 4)" :key="i"></i>
      </span>
    </div>

    <footer class="card-foot">
      <router-link
        v-if="dream.username"
        :to="`/u/${dream.username}`"
        class="author"
        @click.stop
      >
        <span class="author-dot"></span>@{{ dream.username }}
      </router-link>
      <span v-else class="author"><span class="author-dot"></span>匿名</span>
      <span class="card-stats">
        <span v-if="dream.like_count" class="stat">♥ {{ dream.like_count }}</span>
        <span v-if="dream.comment_count" class="stat">💬 {{ dream.comment_count }}</span>
        <span class="date">{{ dream.created_at?.slice(0, 10) }}</span>
      </span>
    </footer>
  </article>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({ dream: Object });

const cardEl = ref(null);
const reduceMotion =
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 指针位置 → 轻微 3D 倾斜 + 高光跟随
function onMove(e) {
  if (reduceMotion || !cardEl.value) return;
  const r = cardEl.value.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width;
  const py = (e.clientY - r.top) / r.height;
  const rx = (0.5 - py) * 8; // 上下倾斜
  const ry = (px - 0.5) * 8; // 左右倾斜
  cardEl.value.style.setProperty('--rx', `${rx}deg`);
  cardEl.value.style.setProperty('--ry', `${ry}deg`);
  cardEl.value.style.setProperty('--gx', `${px * 100}%`);
  cardEl.value.style.setProperty('--gy', `${py * 100}%`);
}
function onLeave() {
  if (!cardEl.value) return;
  cardEl.value.style.setProperty('--rx', '0deg');
  cardEl.value.style.setProperty('--ry', '0deg');
}

const preview = computed(() => {
  const t = props.dream.content || '';
  return t.length > 96 ? t.slice(0, 96) + '…' : t;
});

function parseArr(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}
const scenes = computed(() =>
  parseArr(props.dream.scene_ids ?? props.dream.scenes).map((s) => (typeof s === 'object' ? s.name : s)).filter(Boolean)
);
const emotions = computed(() =>
  parseArr(props.dream.emotion_tags).filter((e) => e && e.name)
);
</script>

<style scoped>
.dream-card {
  position: relative;
  padding: 22px 22px 18px;
  cursor: pointer;
  overflow: hidden;
  --rx: 0deg;
  --ry: 0deg;
  --gx: 70%;
  --gy: 0%;
  transform: perspective(900px) rotateX(var(--rx)) rotateY(var(--ry));
  transition: transform 0.25s var(--ease), box-shadow 0.4s var(--ease),
    border-color 0.4s var(--ease);
  transform-style: preserve-3d;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 200px;
}
.dream-card:hover {
  border-color: var(--line-hi);
  box-shadow: var(--shadow-float), var(--glow-indigo);
}

/* 跟随指针的辉光 */
.card-glow {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    340px circle at var(--gx) var(--gy),
    rgba(129, 140, 248, 0.28),
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.5s var(--ease);
  pointer-events: none;
}
.dream-card:hover .card-glow {
  opacity: 1;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.vis {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
}
.vis--pub {
  color: var(--aurora-teal);
}
.vis--priv {
  color: var(--mist-dim);
}
.ai-flag {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--dawn);
  text-shadow: 0 0 12px rgba(255, 192, 159, 0.5);
}

.card-title {
  font-family: var(--font-serif);
  font-size: 1.32rem;
  font-weight: 500;
  color: var(--moon);
  line-height: 1.25;
}
.card-preview {
  font-size: 0.92rem;
  line-height: 1.7;
  color: var(--mist);
  flex: 1;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.emotion-dots {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 2px;
}
.emotion-dots i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: linear-gradient(120deg, var(--dawn), var(--dawn-deep));
  box-shadow: 0 0 6px rgba(255, 192, 159, 0.5);
}

.card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--line);
  font-size: 0.8rem;
  color: var(--mist-dim);
}
.author {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--mist);
}
.author-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--grad-aurora);
  box-shadow: 0 0 8px var(--aurora-indigo);
}
.card-stats {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.stat {
  color: var(--mist);
}
</style>
