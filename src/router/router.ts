import {
  createRouter,
  createWebHistory,
  RouteLocationNormalized,
  NavigationGuardNext,
} from 'vue-router';
import Home from '@/pages/Home.vue';
import SearchResults from '@/pages/SearchResults.vue';
import BookDetails from '@/pages/BookDetails.vue';
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
      path: '/my-books',
      name: 'my-books',
      component: MyBooks,
    },
  ],
});

export default router;
