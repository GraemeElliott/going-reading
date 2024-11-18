import {
  createRouter,
  createWebHistory,
  RouteLocationNormalized,
  NavigationGuardNext,
} from 'vue-router';
import { useAuthStore } from '@/store/auth-store';
import Home from '@/pages/Home.vue';
import MyAccount from '@/pages/Account/MyAccount.vue';
import SearchResults from '@/pages/SearchResults.vue';
import BookDetails from '@/pages/BookDetails.vue';
import MyBooks from '@/pages/MyBooks.vue';
import MyBooksByStatus from '@/pages/MyBooksByStatus.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/user/:username/account',
      name: 'account',
      component: MyAccount,
      meta: { requiresAuth: true, requiresOwner: true },
    },
    {
      path: '/search/',
      name: 'search-results',
      component: SearchResults,
    },
    {
      path: '/book/:isbn',
      name: 'book-details',
      component: BookDetails,
      props: true,
    },
    {
      path: '/user/:username/my-books',
      name: 'my-books',
      component: MyBooks,
      meta: { requiresAuth: true, requiresOwner: true },
    },
    {
      path: '/user/:username/my-books/:status',
      name: 'my-books-by-status',
      component: MyBooksByStatus,
      meta: { requiresAuth: true, requiresOwner: true },
    },
  ],
});

let authInitialized = false;

// Navigation guard
router.beforeEach(
  async (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    const authStore = useAuthStore();

    // Initialize auth if not already done
    if (!authInitialized) {
      try {
        await authStore.initializeAuth();
        authInitialized = true;
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Proceed with navigation even if auth fails, the auth store will handle the error state
      }
    }

    // Check if route requires authentication
    if (to.matched.some((record) => record.meta.requiresAuth)) {
      // Check if user is authenticated
      if (!authStore.user?.id) {
        // Redirect to auth page with return URL
        next({
          path: '/auth',
          query: { redirect: to.fullPath },
        });
        return;
      }

      // Check if route requires owner access
      if (to.meta.requiresOwner) {
        const username = to.params.username;
        if (username !== authStore.user.username) {
          // Redirect to home if user doesn't own the resource
          next({ name: 'home' });
          return;
        }
      }
    }

    // Proceed with navigation
    next();
  }
);

export default router;
