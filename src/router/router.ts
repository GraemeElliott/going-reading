import {
  createRouter,
  createWebHistory,
  RouteLocationNormalized,
  NavigationGuardNext,
} from 'vue-router';
import Home from '@/pages/Home.vue';
import MyBooks from '@/pages/MyBooks.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/my-books',
      name: 'my-books',
      component: MyBooks,
    },
  ],
});

export default router;
