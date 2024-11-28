<script setup lang="ts">
import type { Book } from '@/types/book';
import type { Author } from '@/types/author';
import { useRouter } from 'vue-router';
import { useDarkModeStore } from '@/store/store';
import { Skeleton } from '@/components/ui/skeleton';

type SearchType = 'title' | 'author' | 'isbn';

const darkModeStore = useDarkModeStore();

const props = defineProps<{
  searchResults: (Book | Author)[];
  searchType: SearchType;
  totalResults: number;
  isSearching: boolean;
  searchQuery: string;
  isHome: boolean;
}>();

const emit = defineEmits(['search-complete']);
const router = useRouter();

const isAuthorResult = (result: Book | Author): result is Author => {
  const hasType = 'type' in result;
  const isAuthor = hasType && (result as Author).type === 'author';
  return isAuthor;
};

const handleResultClick = async (result: Book | Author) => {
  emit('search-complete');

  if (isAuthorResult(result)) {
    const authorPath = encodeURIComponent(result.name);
    await router.push(`/author/${authorPath}`);
  } else {
    await router.push(`/book/${result.isbn}`);
    if (router.currentRoute.value.name === 'book-details') {
      window.location.reload();
    }
  }
};

const handleSeeMore = () => {
  router.push({
    path: '/search',
    query: {
      q: props.searchQuery,
      type: props.searchType,
    },
  });
  emit('search-complete');
};
</script>

<template>
  <ul>
    <div v-if="isSearching" class="flex flex-col p-2">
      <div class="flex flex-row p-2">
        <Skeleton class="h-9 w-9 rounded-full mr-2" />
        <div class="space-y-2 mt-2">
          <Skeleton class="h-4 w-[250px]" />
          <Skeleton class="h-4 w-[200px]" />
        </div>
      </div>
      <div class="flex flex-row p-2">
        <Skeleton class="h-9 w-9 rounded-full mr-2" />
        <div class="space-y-2 mt-2">
          <Skeleton class="h-4 w-[250px]" />
          <Skeleton class="h-4 w-[200px]" />
        </div>
      </div>
      <div class="flex flex-row p-2">
        <Skeleton class="h-9 w-9 rounded-full mr-2" />
        <div class="space-y-2 mt-2">
          <Skeleton class="h-4 w-[250px]" />
          <Skeleton class="h-4 w-[200px]" />
        </div>
      </div>
    </div>
    <li
      v-for="result in searchResults"
      :key="isAuthorResult(result) ? result.name : result.isbn"
      class="flex items-center p-2 cursor-pointer border-b border-gray-100 last:border-b-0"
      @click="handleResultClick(result)"
    >
      <template v-if="isAuthorResult(result)">
        <div class="relative w-10 h-14 mr-3">
          <font-awesome-icon
            icon="fa-solid fa-user"
            class="w-full h-full text-goingTeal absolute inset-0"
          />
        </div>
        <div>
          <p class="font-semibold text-lg">{{ result.name }}</p>
          <p
            class="text-sm"
            :class="{
              'text-black': isHome || (!darkModeStore.darkMode && !isHome),
              'text-gray-400': darkModeStore.darkMode && !isHome,
            }"
          >
            Author
          </p>
        </div>
      </template>

      <template v-else>
        <img
          :src="result.image"
          alt="Book cover"
          class="w-10 h-14 mr-3 object-cover rounded"
        />
        <div>
          <p class="font-semibold">{{ result.title }}</p>
          <p
            class="text-sm"
            :class="{
              'text-black': isHome || (!darkModeStore.darkMode && !isHome),
              'text-gray-400': darkModeStore.darkMode && !isHome,
            }"
          >
            by {{ result.authors.join(', ') }}
          </p>
        </div>
      </template>
    </li>
  </ul>

  <div v-if="totalResults > 5" class="text-center border-t border-gray-100">
    <button
      @click="handleSeeMore"
      class="w-full py-3 font-medium text-sm transition-colors"
      :class="{
        'text-black': isHome || (!darkModeStore.darkMode && !isHome),
        'text-white': darkModeStore.darkMode && !isHome,
      }"
    >
      See more results
    </button>
  </div>
</template>
