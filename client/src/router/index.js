import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
  { path: '/register', name: 'register', component: () => import('../views/RegisterView.vue') },
  { path: '/dreams/new', name: 'dream-new', component: () => import('../views/DreamNewView.vue'), meta: { requiresAuth: true } },
  { path: '/dreams/:id/edit', name: 'dream-edit', component: () => import('../views/DreamNewView.vue'), meta: { requiresAuth: true } },
  { path: '/dreams/:id', name: 'dream-detail', component: () => import('../views/DreamDetailView.vue') },
  { path: '/dreams/:id/continue', name: 'dream-continue', component: () => import('../views/DreamContinueView.vue'), meta: { requiresAuth: true } },
  { path: '/mine', name: 'mine', component: () => import('../views/MineView.vue'), meta: { requiresAuth: true } },
  { path: '/stats', name: 'stats', component: () => import('../views/StatsView.vue'), meta: { requiresAuth: true } },
  { path: '/notifications', name: 'notifications', component: () => import('../views/NotificationsView.vue'), meta: { requiresAuth: true } },
  { path: '/u/:username', name: 'profile', component: () => import('../views/ProfileView.vue') },
  { path: '/favorites', name: 'favorites', component: () => import('../views/FavoritesView.vue'), meta: { requiresAuth: true } },
  { path: '/fragments/weave', name: 'fragment-weave', component: () => import('../views/FragmentWeaveView.vue'), meta: { requiresAuth: true } },
  { path: '/fragments/:id', name: 'fragment-detail', component: () => import('../views/FragmentDetailView.vue'), meta: { requiresAuth: true } },
  { path: '/share/:id', name: 'share-card', component: () => import('../views/ShareCardView.vue') },
];

const router = createRouter({ history: createWebHistory(), routes });

// 未登录用户只能浏览广场与梦境详情，需登录的页面跳转到登录页
router.beforeEach((to) => {
  const isLoggedIn = !!localStorage.getItem('token');
  if (to.meta.requiresAuth && !isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
});

export default router;
