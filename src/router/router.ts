import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/pages/Home.vue';
import SignIn from '@/pages/SignIn.vue';
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
      path: '/sign-in',
      name: 'sign-in',
      component: SignIn,
    },
    {
      path: '/my-books',
      name: 'my-books',
      component: MyBooks,
    },
  ],
});

export default router;
