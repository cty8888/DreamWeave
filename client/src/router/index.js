import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
  { path: '/register', name: 'register', component: () => import('../views/RegisterView.vue') },
  { path: '/dreams/new', name: 'dream-new', component: () => import('../views/DreamNewView.vue') },
  { path: '/dreams/:id', name: 'dream-detail', component: () => import('../views/DreamDetailView.vue') },
  { path: '/dreams/:id/continue', name: 'dream-continue', component: () => import('../views/DreamContinueView.vue') },
  { path: '/mine', name: 'mine', component: () => import('../views/MineView.vue') },
  { path: '/favorites', name: 'favorites', component: () => import('../views/FavoritesView.vue') },
  { path: '/fragments/weave', name: 'fragment-weave', component: () => import('../views/FragmentWeaveView.vue') },
  { path: '/fragments/:id', name: 'fragment-detail', component: () => import('../views/FragmentDetailView.vue') },
  { path: '/share/:id', name: 'share-card', component: () => import('../views/ShareCardView.vue') },
];

const router = createRouter({ history: createWebHistory(), routes });
export default router;
