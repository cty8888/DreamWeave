<template>
  <div ref="cardRef" class="share-card">
    <h2>{{ dream.title || '无标题梦境' }}</h2>
    <p class="excerpt">{{ excerpt }}</p>
    <div class="footer"><span>@{{ dream.username }}</span><span>DreamWeave</span></div>
  </div>
</template>
<script setup>
import { computed } from 'vue';
const props = defineProps({ dream: Object });
const excerpt = computed(() => {
  const text = props.dream?.ai_story || props.dream?.content || '';
  return text.length > 200 ? text.slice(0, 200) + '...' : text;
});
</script>
<style scoped>
.share-card { width: 400px; padding: 32px; background: linear-gradient(135deg, #1a1a2e, #16213e); color: #eee; border-radius: 16px; font-family: Georgia, serif; }
.share-card h2 { font-size: 24px; margin-bottom: 12px; color: #e94560; }
.share-card .excerpt { font-size: 16px; line-height: 1.8; }
.share-card .footer { margin-top: 20px; display: flex; justify-content: space-between; font-size: 14px; color: #aaa; }
</style>
