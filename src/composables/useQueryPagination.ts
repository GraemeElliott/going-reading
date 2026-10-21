import { computed, watch, type Ref, type WatchSource } from 'vue';
import { useRoute, useRouter } from 'vue-router';

/**
 * Client-side pagination with the page kept in ?page= (left out for page 1),
 * so Back and Forward step through pages. A page click pushes a history entry;
 * resets (filters changing, an out-of-range page) replace the current one.
 * Scrolling is left to the router's scrollBehavior.
 */
export function useQueryPagination<T>(
  items: Ref<T[]>,
  options: {
    pageSize: number;
    /** Changes to these go back to page 1 */
    resetOn: WatchSource[];
    /** Until true, an out-of-range ?page= is kept, so a deep link survives loading */
    ready: WatchSource<boolean>;
  }
) {
  const route = useRoute();
  const router = useRouter();

  const setPage = (page: number, mode: 'push' | 'replace') =>
    router[mode]({ query: { ...route.query, page: page > 1 ? String(page) : undefined } });

  const currentPage = computed({
    get: () => {
      const page = Number(route.query.page);
      return Number.isInteger(page) && page > 1 ? page : 1;
    },
    set: (page) => setPage(page, 'push'),
  });

  const pageCount = computed(() => Math.ceil(items.value.length / options.pageSize));
  const pagedItems = computed(() => {
    const start = (currentPage.value - 1) * options.pageSize;
    return items.value.slice(start, start + options.pageSize);
  });

  watch(options.resetOn, () => {
    if (currentPage.value > 1) setPage(1, 'replace');
  });
  // Covers a stale or hand-typed ?page=, and removing the last item on the final page
  watch(
    [pageCount, options.ready],
    ([count, ready]) => {
      if (ready && currentPage.value > Math.max(count, 1)) setPage(count, 'replace');
    },
    { immediate: true }
  );

  return { currentPage, pageCount, pagedItems };
}
