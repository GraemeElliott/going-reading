import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/views/HomeView.vue';
import Register from '@/views/RegisterView.vue';
import SignIn from '@/views/SigninView.vue';

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: Home,
    },
    {
      path: '/sign-in',
      component: SignIn,
    },
    {
      path: '/register',
      component: Register,
    },
  ],
});
