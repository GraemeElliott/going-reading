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
      path: '/user/:username/my-account',
      name: 'my-account',
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

  // Ensure that the auth store is initialized
  if (!authStore.user) {
    await authStore.initializeAuth(); // Initialize auth state if not already done
  }

  const isAuthenticated = authStore.user; // Check if the user is authenticated
  const currentUsername = authStore.userMetadata?.username; // Get the logged-in user's username

  // Check if the route requires authentication
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      // If not authenticated, redirect to sign-in page and pass the intended route as a query
      return next({ name: 'sign-in', query: { redirect: to.fullPath } });
    }

    // Check if the route requires the logged-in user to own the account
    if (to.matched.some((record) => record.meta.requiresOwner)) {
      // If the username in the URL does not match the logged-in user's username, redirect to home
      if (to.params.username !== currentUsername) {
        return next({ name: 'home' });
      }
    }
  }

  // Allow navigation to proceed
  next();
});

export default router;
