<template>
  <div class="page">
    <div class="section-head">
      <p class="eyebrow">潜意识的形状</p>
      <h1>梦境图谱</h1>
    </div>

    <div v-if="loading" class="loading-state"><span class="spinner"></span><span>正在统计你的梦……</span></div>

    <template v-else-if="stats && stats.total">
      <!-- 概览卡 -->
      <div class="cards stagger">
        <div class="stat-card glass">
          <span class="num">{{ total }}</span>
          <span class="cap">记录的梦</span>
        </div>
        <div class="stat-card glass">
          <span class="num dawn">{{ aiNum }}</span>
          <span class="cap">AI 续写 / 解析</span>
        </div>
        <div class="stat-card glass">
          <span class="num teal">{{ pubNum }}</span>
          <span class="cap">公开</span>
        </div>
        <div class="stat-card glass">
          <span class="num">{{ privNum }}</span>
          <span class="cap">私有</span>
        </div>
      </div>

      <div class="two-col">
        <!-- 情感 -->
        <section v-reveal class="panel glass">
          <h2>情感光谱</h2>
          <p class="panel-sub">条形长度=出现次数，圆点=平均强度</p>
          <div v-if="stats.emotions.length" class="bars">
            <div v-for="e in stats.emotions" :key="e.name" class="bar-row">
              <span class="bar-name">{{ e.name }}</span>
              <div class="bar-track">
                <div
                  class="bar-fill bar-fill--emotion"
                  :style="{ width: pct(e.count, maxEmotion) + '%' }"
                ></div>
              </div>
              <span class="bar-val">
                ×{{ e.count }}
                <span class="dots">
                  <i v-for="n in 5" :key="n" :class="{ on: n <= Math.round(e.avgIntensity) }"></i>
                </span>
              </span>
            </div>
          </div>
          <p v-else class="empty-state">还没有情感标签数据</p>
        </section>

        <!-- 场景 -->
        <section v-reveal="80" class="panel glass">
          <h2>常去的梦境场景</h2>
          <p class="panel-sub">你最常梦见的主题</p>
          <div v-if="stats.scenes.length" class="bars">
            <div v-for="s in stats.scenes" :key="s.name" class="bar-row">
              <span class="bar-name">{{ s.name }}</span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: pct(s.count, maxScene) + '%' }"></div>
              </div>
              <span class="bar-val">×{{ s.count }}</span>
            </div>
          </div>
          <p v-else class="empty-state">还没有场景标签数据</p>
        </section>
      </div>

      <!-- 记录热力图 -->
      <section v-reveal class="panel glass">
        <h2>记录足迹</h2>
        <p class="panel-sub">最近 16 周，颜色越亮记录越多</p>
        <div class="heatmap">
          <div v-for="(week, wi) in heatWeeks" :key="wi" class="heat-week">
            <span
              v-for="(day, di) in week"
              :key="di"
              class="heat-cell"
              :class="'lv' + day.level"
              :title="day.date + '：' + day.count + ' 个梦'"
            ></span>
          </div>
        </div>
        <div class="heat-legend">
          <span>少</span>
          <span class="heat-cell lv0"></span>
          <span class="heat-cell lv1"></span>
          <span class="heat-cell lv2"></span>
          <span class="heat-cell lv3"></span>
          <span class="heat-cell lv4"></span>
          <span>多</span>
        </div>
      </section>
    </template>

    <p v-else class="empty-state">还没有梦境数据，去记录第一个梦吧。</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import apiClient from '../api/client';
import { useCountUp } from '../composables/useCountUp';

const stats = ref(null);
const loading = ref(true);

const { value: total, run: runTotal } = useCountUp();
const { value: aiNum, run: runAi } = useCountUp();
const { value: pubNum, run: runPub } = useCountUp();
const { value: privNum, run: runPriv } = useCountUp();

onMounted(async () => {
  try {
    const r = await apiClient.get('/stats');
    stats.value = r.data;
    // 数字滚动计数
    runTotal(stats.value.total);
    runAi(stats.value.aiCount);
    runPub(stats.value.publicCount);
    runPriv(stats.value.privateCount);
  } finally {
    loading.value = false;
  }
});

const maxEmotion = computed(() => Math.max(1, ...(stats.value?.emotions || []).map((e) => e.count)));
const maxScene = computed(() => Math.max(1, ...(stats.value?.scenes || []).map((s) => s.count)));
function pct(v, max) {
  return Math.max(6, Math.round((v / max) * 100));
}

// 构建最近 16 周的热力图（每列一周，周日→周六）
const heatWeeks = computed(() => {
  const counts = {};
  for (const d of stats.value?.calendar || []) counts[d.date] = d.count;
  const max = Math.max(1, ...Object.values(counts));

  const today = new Date();
  const end = new Date(today);
  // 回退到本周六，保证最后一列完整
  end.setDate(end.getDate() + (6 - end.getDay()));
  const totalDays = 16 * 7;
  const start = new Date(end);
  start.setDate(start.getDate() - totalDays + 1);

  const weeks = [];
  let week = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const count = counts[iso] || 0;
    const level = count === 0 ? 0 : Math.min(4, Math.ceil((count / max) * 4));
    week.push({ date: iso, count, level });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) weeks.push(week);
  return weeks;
});
</script>

<style scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 18px;
  margin-bottom: 26px;
}
.stat-card {
  padding: 26px 22px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.stat-card .num {
  font-family: var(--font-display);
  font-size: 2.6rem;
  font-weight: 600;
  color: var(--moon);
  line-height: 1;
}
.stat-card .num.dawn {
  color: var(--dawn);
}
.stat-card .num.teal {
  color: var(--aurora-teal);
}
.stat-card .cap {
  font-size: 0.85rem;
  color: var(--mist-dim);
  letter-spacing: 0.04em;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}
@media (max-width: 820px) {
  .two-col {
    grid-template-columns: 1fr;
  }
}

.panel {
  padding: 26px 28px;
}
.panel h2 {
  margin-bottom: 4px;
}
.panel-sub {
  font-size: 0.82rem;
  color: var(--mist-dim);
  margin-bottom: 22px;
}

.bars {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.bar-row {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  align-items: center;
  gap: 12px;
}
.bar-name {
  font-size: 0.88rem;
  color: var(--moon);
  text-align: right;
  white-space: nowrap;
}
.bar-track {
  height: 12px;
  border-radius: 999px;
  background: rgba(10, 12, 26, 0.6);
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--aurora-teal), var(--aurora-indigo));
  animation: grow 0.8s var(--ease) both;
}
.bar-fill--emotion {
  background: linear-gradient(90deg, var(--dawn), var(--dawn-deep));
}
@keyframes grow {
  from {
    transform: scaleX(0);
    transform-origin: left;
  }
}
.bar-val {
  font-size: 0.78rem;
  color: var(--mist);
  font-variant-numeric: tabular-nums;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}
.dots {
  display: inline-flex;
  gap: 2px;
}
.dots i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
}
.dots i.on {
  background: var(--dawn);
  box-shadow: 0 0 5px var(--dawn);
}

/* 热力图 */
.heatmap {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding-bottom: 6px;
}
.heat-week {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.heat-cell {
  width: 13px;
  height: 13px;
  border-radius: 3px;
  background: rgba(60, 68, 120, 0.25);
}
.heat-cell.lv0 { background: rgba(60, 68, 120, 0.22); }
.heat-cell.lv1 { background: rgba(94, 234, 212, 0.3); }
.heat-cell.lv2 { background: rgba(94, 234, 212, 0.55); }
.heat-cell.lv3 { background: rgba(129, 140, 248, 0.75); }
.heat-cell.lv4 { background: var(--aurora-violet); box-shadow: 0 0 6px rgba(196, 164, 255, 0.7); }
.heat-legend {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 16px;
  font-size: 0.74rem;
  color: var(--mist-dim);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 90px 20px;
  color: var(--mist-dim);
  font-family: var(--font-serif);
  font-style: italic;
}
</style>
