<template>
  <div class="page page--narrow">
    <div class="section-head">
      <p class="eyebrow">谁在你的梦里留下痕迹</p>
      <h1>通知</h1>
    </div>

    <div v-if="notif.items.length" class="notif-list stagger">
      <component
        :is="n.dream_id ? 'router-link' : 'div'"
        v-for="n in notif.items"
        :key="n.id"
        :to="n.dream_id ? `/dreams/${n.dream_id}` : undefined"
        class="notif glass"
        :class="{ unread: !n.is_read }"
      >
        <span class="notif-icon">{{ icon(n.type) }}</span>
        <span class="notif-text">
          <router-link :to="`/u/${n.actor_username}`" class="actor" @click.stop>@{{ n.actor_username }}</router-link>
          {{ verb(n.type) }}
          <span v-if="n.dream_title" class="dream-title">「{{ n.dream_title }}」</span>
        </span>
        <span class="notif-date">{{ n.created_at?.slice(5, 16).replace('T', ' ') }}</span>
      </component>
    </div>
    <p v-else class="empty-state">还没有任何通知。</p>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { useNotificationsStore } from '../stores/notifications';

const notif = useNotificationsStore();

const ICONS = { continue: '✏️', like: '♥', comment: '💬', follow: '✦' };
const VERBS = {
  continue: '接力续写了你的梦',
  like: '点赞了你的梦',
  comment: '评论了你的梦',
  follow: '关注了你',
};
function icon(t) {
  return ICONS[t] || '🔔';
}
function verb(t) {
  return VERBS[t] || '与你互动';
}

onMounted(async () => {
  await notif.fetch();
  // 浏览后标记全部已读
  if (notif.unread) await notif.markAllRead();
});
onBeforeUnmount(() => {
  /* 离开时保持已读状态 */
});
</script>

<style scoped>
.notif-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.notif {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  text-decoration: none;
  color: var(--mist);
  transition: transform 0.25s var(--ease), border-color 0.25s var(--ease);
}
a.notif:hover {
  transform: translateY(-2px);
  border-color: var(--line-hi);
}
.notif.unread {
  border-color: rgba(255, 192, 159, 0.3);
  background: rgba(255, 192, 159, 0.06);
}
.notif-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--surface-hi);
  border: 1px solid var(--line);
  font-size: 1rem;
}
.notif-text {
  flex: 1;
  line-height: 1.6;
  color: var(--moon);
}
.actor {
  font-weight: 600;
  color: var(--aurora-teal);
}
.dream-title {
  color: var(--mist);
}
.notif-date {
  font-size: 0.76rem;
  color: var(--mist-dim);
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
