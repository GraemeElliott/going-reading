import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/auth-store';
import Home from '@/pages/Home.vue';
import Register from '@/pages/Register.vue';
import SignIn from '@/pages/SignIn.vue';
import UserProfile from '@/pages/UserProfile.vue';
import MyAccount from '@/pages/Account/MyAccount.vue';
import MyBooks from '@/pages/Account/MyBooks.vue';
import AdminDashboard from '@/pages/Admin/AdminDashboard.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
    },
    {
      path: '/sign-in',
      name: 'sign-in',
      component: SignIn,
    },
    {
      path: '/user/:username',
      name: 'user-profile',
      component: UserProfile,
      meta: { requiresAuth: true },
    },
    {
      path: '/user/:username/account',
      name: 'account',
      component: MyAccount,
      meta: { requiresAuth: true, requiresOwner: true },
    },
    {
      path: '/user/:username/my-books',
      name: 'my-books',
      component: MyBooks,
      meta: { requiresAuth: true, requiresOwner: true },
    },
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: AdminDashboard,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  if (!authStore.user) {
    await authStore.initializeAuth();
  }

  const isAuthenticated = authStore.user;
  const currentUsername = authStore.userMetadata?.username;

  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      return next({ name: 'sign-in', query: { redirect: to.fullPath } });
    }

    if (to.matched.some((record) => record.meta.requiresOwner)) {
      if (to.params.username !== currentUsername) {
        return next({ name: 'home' });
      }
    }
  }
  next();
});

export default router;
