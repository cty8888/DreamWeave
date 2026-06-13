<template>
  <div class="share-card">
    <div class="sc-glow"></div>
    <div class="sc-top">
      <span class="sc-brand">✦ DreamWeave</span>
      <span class="sc-kind">{{ dream.ai_story ? 'AI 续写' : '梦境' }}</span>
    </div>

    <h2 class="sc-title">{{ dream.title || '无题之梦' }}</h2>
    <div class="sc-rule"></div>
    <p class="sc-excerpt">{{ excerpt }}</p>

    <div class="sc-foot">
      <span class="sc-author">@{{ dream.username }}</span>
      <span class="sc-tag">梦境续写</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({ dream: Object });
const excerpt = computed(() => {
  const text = props.dream?.ai_story || props.dream?.content || '';
  return text.length > 180 ? text.slice(0, 180) + '…' : text;
});
</script>

<style scoped>
/* html2canvas 安全：仅使用实色 / 标准线性渐变，无 backdrop-filter / mask */
.share-card {
  position: relative;
  width: 420px;
  padding: 38px 36px 30px;
  border-radius: 24px;
  overflow: hidden;
  background:
    linear-gradient(160deg, #181b3a 0%, #0c0e22 55%, #100a1e 100%);
  border: 1px solid rgba(160, 170, 230, 0.22);
  color: #eef0ff;
  font-family: 'Noto Serif SC', 'Fraunces', Georgia, serif;
  box-shadow: 0 30px 80px -30px rgba(0, 0, 0, 0.9);
}
.sc-glow {
  position: absolute;
  top: -120px;
  right: -100px;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(129, 140, 248, 0.55), rgba(94, 234, 212, 0.12) 55%, transparent 72%);
}
.sc-top {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 26px;
}
.sc-brand {
  font-family: 'Manrope', sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #c4a4ff;
}
.sc-kind {
  font-family: 'Manrope', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #ffc09f;
  padding: 4px 11px;
  border-radius: 999px;
  border: 1px solid rgba(255, 192, 159, 0.4);
}
.sc-title {
  position: relative;
  font-size: 27px;
  font-weight: 500;
  line-height: 1.3;
  color: #ffffff;
  margin: 0 0 16px;
}
.sc-rule {
  width: 48px;
  height: 3px;
  border-radius: 3px;
  background: linear-gradient(90deg, #5eead4, #818cf8);
  margin-bottom: 18px;
}
.sc-excerpt {
  position: relative;
  font-size: 16px;
  line-height: 1.95;
  color: #c8cce8;
  margin: 0;
}
.sc-foot {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 28px;
  padding-top: 18px;
  border-top: 1px solid rgba(160, 170, 230, 0.18);
  font-family: 'Manrope', sans-serif;
  font-size: 13px;
}
.sc-author {
  color: #5eead4;
  font-weight: 600;
}
.sc-tag {
  color: #6f76a0;
  letter-spacing: 0.05em;
}
</style>
