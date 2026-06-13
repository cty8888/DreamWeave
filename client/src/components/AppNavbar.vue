<template>
  <header class="nav-wrap" :class="{ scrolled }">
    <nav class="nav glass">
      <router-link to="/" class="brand">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="26" height="26">
            <defs>
              <linearGradient id="moonGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#5eead4" />
                <stop offset="0.55" stop-color="#818cf8" />
                <stop offset="1" stop-color="#c4a4ff" />
              </linearGradient>
            </defs>
            <path
              d="M22 4a12 12 0 1 0 6 22 10 10 0 0 1-6-18z"
              fill="url(#moonGrad)"
            />
            <circle cx="9" cy="9" r="1.3" fill="#ffc09f" />
            <circle cx="13" cy="5" r="0.9" fill="#fff" />
          </svg>
        </span>
        <span class="brand-text">梦境续写</span>
      </router-link>

      <div class="nav-links">
        <router-link to="/" class="nav-link">广场</router-link>
        <template v-if="auth.isLoggedIn">
          <router-link to="/dreams/new" class="nav-link">记录</router-link>
          <router-link to="/fragments/weave" class="nav-link">串联</router-link>
          <router-link to="/mine" class="nav-link">我的</router-link>
          <router-link to="/stats" class="nav-link">图谱</router-link>
          <router-link to="/favorites" class="nav-link">收藏</router-link>
        </template>
      </div>

      <div class="nav-auth">
        <template v-if="auth.isLoggedIn">
          <router-link to="/notifications" class="bell" title="通知">
            <span aria-hidden="true">🔔</span>
            <span v-if="notif.unread" class="bell-badge">{{ notif.unread > 99 ? '99+' : notif.unread }}</span>
          </router-link>
          <router-link :to="`/u/${auth.user?.username}`" class="user-pill">
            <span class="avatar">{{ initial }}</span>
            <span class="uname">{{ auth.user?.username }}</span>
          </router-link>
          <button class="btn-ghost btn-sm" @click="logout">退出</button>
        </template>
        <router-link v-else to="/login" class="btn btn-sm">登录 / 注册</router-link>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter, useRoute } from 'vue-router';
import { useNotificationsStore } from '../stores/notifications';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const notif = useNotificationsStore();
const initial = computed(() => (auth.user?.username || '?').slice(0, 1).toUpperCase());

const scrolled = ref(false);
function onScroll() {
  scrolled.value = window.scrollY > 12;
}

// 登录时拉取未读数；每次切换路由刷新（轻量轮询的替代）
function refreshNotif() {
  if (auth.isLoggedIn) notif.fetch();
  else notif.reset();
}
watch(() => route.fullPath, refreshNotif);
watch(() => auth.isLoggedIn, refreshNotif);

onMounted(() => {
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  refreshNotif();
});
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll));

function logout() {
  auth.logout();
  notif.reset();
  router.push('/');
}
</script>

<style scoped>
.nav-wrap {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 16px 20px 0;
  transition: padding 0.4s var(--ease);
}
.nav-wrap.scrolled {
  padding-top: 10px;
}

.nav {
  max-width: var(--maxw);
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 11px 14px 11px 20px;
  border-radius: 999px;
  transition: box-shadow 0.4s var(--ease), border-color 0.4s var(--ease),
    background 0.4s var(--ease);
}
.scrolled .nav {
  box-shadow: var(--shadow-float), var(--glow-indigo);
  border-color: var(--line-hi);
  background: rgba(14, 17, 36, 0.78);
}

/* 品牌 */
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.brand-mark {
  display: grid;
  place-items: center;
  filter: drop-shadow(0 0 8px rgba(129, 140, 248, 0.6));
}
.brand-text {
  font-family: var(--font-display);
  font-size: 1.22rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--moon);
}

/* 中部链接 */
.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0 auto;
  flex-wrap: wrap;
  justify-content: center;
}
.nav-link {
  position: relative;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--mist);
  padding: 7px 14px;
  border-radius: 999px;
  transition: color 0.25s var(--ease), background 0.25s var(--ease);
}
.nav-link:hover {
  color: var(--moon);
  background: rgba(129, 140, 248, 0.1);
}
.nav-link.router-link-exact-active {
  color: var(--moon);
  background: rgba(129, 140, 248, 0.18);
}
.nav-link.router-link-exact-active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 1px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  transform: translateX(-50%);
  background: var(--aurora-teal);
  box-shadow: 0 0 8px var(--aurora-teal);
}

/* 右侧认证区 */
.nav-auth {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.btn-sm {
  padding: 8px 18px;
  font-size: 0.88rem;
}
.bell {
  position: relative;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  font-size: 1.05rem;
  background: var(--surface-hi);
  border: 1px solid var(--line);
  transition: border-color 0.25s var(--ease), transform 0.25s var(--ease);
}
.bell:hover {
  border-color: var(--glow-ring);
  transform: translateY(-2px);
}
.bell-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 700;
  color: #2a1206;
  background: var(--grad-dawn);
  display: grid;
  place-items: center;
  box-shadow: 0 0 10px rgba(255, 158, 125, 0.7);
  animation: rise 0.4s var(--ease);
}
.user-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--moon);
  transition: opacity 0.2s;
}
.user-pill:hover {
  opacity: 0.85;
}
.avatar {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--ink-on-light);
  background: var(--grad-aurora);
  box-shadow: var(--glow-indigo);
}

@media (max-width: 860px) {
  .nav {
    flex-wrap: wrap;
    border-radius: var(--radius-lg);
    padding: 14px 18px;
  }
  .nav-links {
    order: 3;
    width: 100%;
    margin: 4px 0 0;
    justify-content: flex-start;
  }
  .nav-auth {
    margin-left: auto;
  }
}
@media (max-width: 480px) {
  .user-pill span:last-child {
    display: none;
  }
}
</style>
