<template>
  <div id="app">
    <!-- 顶部滚动进度条 -->
    <div class="scroll-progress" :style="{ transform: `scaleX(${progress})` }" aria-hidden="true"></div>

    <!-- 大气层：漂移极光 + 星尘（随鼠标轻微视差） -->
    <div ref="atmosphere" class="atmosphere" aria-hidden="true">
      <span class="aurora aurora--1"></span>
      <span class="aurora aurora--2"></span>
      <span class="aurora aurora--3"></span>
      <div class="stars"></div>
    </div>

    <AppNavbar />
    <main>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="site-foot">
      <span>DreamWeave · 梦境续写</span>
      <span class="dot">·</span>
      <span>记录你的梦，让它成为故事</span>
    </footer>

    <!-- 回到顶部 -->
    <transition name="pop">
      <button v-show="showTop" class="to-top" title="回到顶部" @click="scrollTop">↑</button>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import AppNavbar from './components/AppNavbar.vue';

const atmosphere = ref(null);
let raf = null;
const target = { x: 0, y: 0 };
const current = { x: 0, y: 0 };

const progress = ref(0);
const showTop = ref(false);
function onScroll() {
  const h = document.documentElement;
  const max = h.scrollHeight - h.clientHeight;
  progress.value = max > 0 ? Math.min(1, h.scrollTop / max) : 0;
  showTop.value = h.scrollTop > 600;
}
function scrollTop() {
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}

const reduceMotion =
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function onMove(e) {
  // 归一化到 [-1, 1]
  target.x = (e.clientX / window.innerWidth - 0.5) * 2;
  target.y = (e.clientY / window.innerHeight - 0.5) * 2;
}

function tick() {
  // 缓动逼近，营造柔和的漂移感
  current.x += (target.x - current.x) * 0.05;
  current.y += (target.y - current.y) * 0.05;
  if (atmosphere.value) {
    atmosphere.value.style.setProperty('--mx', `${current.x * 24}px`);
    atmosphere.value.style.setProperty('--my', `${current.y * 24}px`);
  }
  raf = requestAnimationFrame(tick);
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (reduceMotion) return;
  window.addEventListener('mousemove', onMove, { passive: true });
  raf = requestAnimationFrame(tick);
});
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('mousemove', onMove);
  if (raf) cancelAnimationFrame(raf);
});
</script>

<style scoped>
#app {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
}

/* 顶部滚动进度条 */
.scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  z-index: 200;
  background: linear-gradient(90deg, var(--aurora-teal), var(--aurora-indigo), var(--aurora-violet), var(--dawn));
  transform-origin: 0 50%;
  transform: scaleX(0);
  box-shadow: 0 0 10px rgba(129, 140, 248, 0.6);
}

/* 回到顶部 */
.to-top {
  position: fixed;
  right: 26px;
  bottom: 26px;
  z-index: 150;
  width: 46px;
  height: 46px;
  padding: 0;
  border-radius: 50%;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--moon);
  background: var(--surface-hi);
  border: 1px solid var(--line-hi);
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow-card);
}
.to-top:hover {
  box-shadow: var(--glow-indigo);
  border-color: var(--glow-ring);
}
.to-top::after {
  display: none; /* 不要按钮的光泽扫过 */
}
.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.3s var(--ease), transform 0.3s var(--ease);
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.8);
}

main {
  flex: 1 1 auto;
}

/* ---- 大气层 ---- */
.atmosphere {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
  --mx: 0px;
  --my: 0px;
}

.aurora {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.55;
  will-change: transform;
}
.aurora--1 {
  width: 46vw;
  height: 46vw;
  top: -14vw;
  right: -8vw;
  background: radial-gradient(circle, rgba(129, 140, 248, 0.85), transparent 68%);
  animation: drift 22s var(--ease) infinite;
  translate: calc(var(--mx) * 1.6) calc(var(--my) * 1.6);
}
.aurora--2 {
  width: 40vw;
  height: 40vw;
  bottom: -16vw;
  left: -10vw;
  background: radial-gradient(circle, rgba(94, 234, 212, 0.6), transparent 68%);
  animation: drift 28s var(--ease) infinite reverse;
  translate: calc(var(--mx) * -1.1) calc(var(--my) * -1.1);
}
.aurora--3 {
  width: 34vw;
  height: 34vw;
  bottom: -8vw;
  right: 18vw;
  background: radial-gradient(circle, rgba(255, 158, 125, 0.45), transparent 70%);
  animation: drift 32s var(--ease) infinite;
  translate: calc(var(--mx) * 0.8) calc(var(--my) * 0.8);
}

/* ---- 星尘：多层 radial-gradient 点阵 ---- */
.stars {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1.5px 1.5px at 12% 22%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 28% 68%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1.5px 1.5px at 47% 12%, rgba(196, 164, 255, 0.9), transparent),
    radial-gradient(1px 1px at 63% 48%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(1.5px 1.5px at 78% 28%, rgba(94, 234, 212, 0.8), transparent),
    radial-gradient(1px 1px at 88% 72%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1px 1px at 38% 88%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(1.5px 1.5px at 7% 82%, rgba(255, 192, 159, 0.7), transparent);
  background-repeat: no-repeat;
  animation: twinkle 6s ease-in-out infinite;
  translate: calc(var(--mx) * 0.4) calc(var(--my) * 0.4);
}

/* ---- 页脚 ---- */
.site-foot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 28px 20px 36px;
  font-size: 0.82rem;
  letter-spacing: 0.04em;
  color: var(--mist-dim);
  border-top: 1px solid var(--line);
}
.site-foot .dot {
  color: var(--aurora-indigo);
}

/* ---- 路由切换动画 ---- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.32s var(--ease), transform 0.32s var(--ease);
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
