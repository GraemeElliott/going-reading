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
import Bookshelves from '@/pages/Bookshelves.vue';
import Library from '@/pages/Library.vue';
import AuthorDetails from '@/pages/AuthorDetails.vue';
import ReadingStatsDashboard from '@/pages/ReadingStats/ReadingStatsDashboard.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/account',
      name: 'account',
      component: MyAccount,
      meta: { requiresAuth: true },
    },
    {
      path: '/search/',
      name: 'search-results',
      component: SearchResults,
      meta: { fullWidth: true },
    },
    {
      path: '/book/:isbn',
      name: 'book-details',
      component: BookDetails,
      props: true,
    },
    {
      path: '/author/:name',
      name: 'author-details',
      component: AuthorDetails,
      props: true,
    },
    {
      path: '/reading-stats',
      name: 'reading-stats',
      component: ReadingStatsDashboard,
      meta: { requiresAuth: true, fullWidth: true },
    },
    {
      path: '/my-books',
      name: 'my-books',
      component: MyBooks,
      meta: { requiresAuth: true, fullWidth: true },
    },
    {
      path: '/my-books/library',
      name: 'library',
      component: Library,
      meta: { requiresAuth: true, fullWidth: true },
    },
    {
      path: '/my-books/bookshelves',
      name: 'bookshelves',
      component: Bookshelves,
      meta: { requiresAuth: true, fullWidth: true },
    },
    // Old URLs that included the username
    { path: '/user/:username/my-books', redirect: '/my-books' },
    { path: '/user/:username/reading-stats', redirect: '/reading-stats' },
    { path: '/user/:username/account', redirect: '/account' },
    {
      path: '/user/:username/my-books/:status',
      redirect: (to) => ({
        path: '/my-books/bookshelves',
        query: { shelf: to.params.status },
      }),
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

    // Redirect from home to my-books if authenticated
    if (to.path === '/' && isAuthenticated && currentUsername) {
      return next('/my-books');
    }

    if (to.matched.some((record) => record.meta.requiresAuth)) {
      if (!isAuthenticated) {
        return next({ name: 'sign-in', query: { redirect: to.fullPath } });
      }
    }
    next();
  }
);

export default router;
