<script setup lang="ts">
import type { Book } from '@/types/book';
import type { Author } from '@/types/author';
import { useRouter } from 'vue-router';
import { Skeleton } from '@/components/ui/skeleton';

type SearchType = 'title' | 'author' | 'isbn';

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
      class="flex items-center p-2 cursor-pointer border-b last:border-b-0"
      :class="isHome ? 'border-gray-100' : 'border-gr-line'"
      @click="handleResultClick(result)"
    >
      <template v-if="isAuthorResult(result)">
        <div class="ml-4">
          <p class="font-semibold text-lg">{{ result.name }}</p>
          <p
            class="text-sm"
            :class="isHome ? 'text-black' : 'text-gr-muted'"
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
            :class="isHome ? 'text-black' : 'text-gr-muted'"
          >
            by {{ result.authors.join(', ') }}
          </p>
          <p
            class="text-sm"
            :class="isHome ? 'text-black' : 'text-gr-muted'"
          >
            Pages: {{ result.pages }}
          </p>
        </div>
      </template>
    </li>
  </ul>

  <div
    v-if="totalResults > 5"
    class="text-center border-t"
    :class="isHome ? 'border-gray-100' : 'border-gr-line'"
  >
    <button
      @click="handleSeeMore"
      class="w-full py-3 font-medium text-sm transition-colors"
      :class="isHome ? 'text-black' : 'text-gr-text'"
    >
      See more results
    </button>
  </div>
</template>
