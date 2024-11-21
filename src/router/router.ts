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
import AuthorDetails from '@/pages/AuthorDetails.vue';

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
      path: '/author/:id',
      name: 'author-details',
      component: AuthorDetails,
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
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

router.beforeEach(
  async (
    to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
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
  }
);

export default router;
