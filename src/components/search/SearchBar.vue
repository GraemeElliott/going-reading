<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { Input } from '@/components/ui/input';
import { useRoute, useRouter } from 'vue-router';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import bookApiService from '@/services/bookApiService';
import type { Book } from '@/types/book';
import type { Author } from '@/types/author';
import { debounce } from 'lodash';
import SearchBarResults from '@/components/search/SearchBarResults.vue';

type SearchType = 'title' | 'author' | 'isbn';

const searchTypes: SearchType[] = ['title', 'author', 'isbn'];

const props = defineProps<{
  isHome: boolean;
}>();

// The home page keeps its own colours; everywhere else uses the theme tokens.
// `!` is needed because Input and SelectTrigger apply their colours last.
const fieldClass = computed(() =>
  props.isHome
    ? ''
    : '!border-gr-line !bg-gr-surface !text-gr-text placeholder:text-gr-muted'
);
const menuClass = computed(() =>
  props.isHome ? '' : 'border-gr-line bg-gr-surface text-gr-text'
);
const menuItemClass = computed(() =>
  props.isHome ? '' : 'text-gr-text focus:bg-gr-surface-2 focus:text-gr-text'
);
const searchQuery = ref<string>('');
const searchResults = ref<(Book | Author)[]>([]);
const isSearching = ref(false);
const totalResults = ref(0);
const isInputFocused = ref(false);
const searchType = ref<SearchType>('title');
const searchContainer = ref<HTMLDivElement | null>(null);
const router = useRouter();
const route = useRoute();

const emit = defineEmits(['search-complete']);

const handleSubmit = (e: Event) => {
  e.preventDefault();
  if (searchQuery.value.length >= 3) {
    router.push({
      path: '/search',
      query: {
        q: searchQuery.value,
        type: searchType.value,
      },
    });
    // Keep the query in the field on the results page so it can be refined
    searchResults.value = [];
    totalResults.value = 0;
    isInputFocused.value = false;
  }
};

const performSearch = debounce(async (newQuery: string) => {
  if (!newQuery || newQuery.length < 3) {
    searchResults.value = [];
    isSearching.value = false;
    totalResults.value = 0;
    return;
  }

  isSearching.value = true;

  try {
    const data = await bookApiService.searchQuery(newQuery, searchType.value);
    totalResults.value = data.length;
    searchResults.value = data.slice(0, 5);
  } catch (error) {
    console.error('Search error:', error);
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
}, 500);

const clearSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
  totalResults.value = 0;
};

const handleFocus = () => {
  isInputFocused.value = true;
};

const handleBlur = () => {
  setTimeout(() => {
    isInputFocused.value = false;
  }, 200); // Small delay to allow click events on results
};

const setSearchType = (value: string) => {
  if (searchTypes.includes(value as SearchType)) {
    searchType.value = value as SearchType;
  }
};

// While copying the query/type from the URL, don't run the dropdown search
// or clear the field
let syncingFromRoute = false;

// Watch for changes in searchQuery
watch(searchQuery, (newQuery) => {
  searchResults.value = [];
  totalResults.value = 0;
  if (syncingFromRoute) return;
  performSearch(newQuery);
});

// Watch for changes in searchType
watch(searchType, () => {
  if (syncingFromRoute) return;
  clearSearch();
});

// On the search results page the field shows the current search; leaving it clears the field
watch(
  () => [route.name, route.query.q, route.query.type],
  ([name, q, type], old) => {
    if (name === 'search-results') {
      syncingFromRoute = true;
      if (searchTypes.includes(type as SearchType)) searchType.value = type as SearchType;
      searchQuery.value = typeof q === 'string' ? q : '';
      nextTick(() => {
        syncingFromRoute = false;
      });
    } else if (old?.[0] === 'search-results') {
      clearSearch();
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="relative w-full" ref="searchContainer">
    <form @submit="handleSubmit" class="flex gap-2">
      <Select :model-value="searchType" @update:model-value="setSearchType">
        <SelectTrigger
          :class="['h-11 w-[100px] shrink-0 rounded-[10px]', fieldClass]"
          :isHome="isHome"
          aria-label="Search by"
        >
          <SelectValue
            :placeholder="
              searchType.charAt(0).toUpperCase() + searchType.slice(1)
            "
          />
        </SelectTrigger>
        <SelectContent :class="menuClass" :isHome="isHome">
          <SelectGroup>
            <SelectItem value="title" :class="menuItemClass" :isHome="isHome"
              >Title</SelectItem
            >
            <SelectItem value="author" :class="menuItemClass" :isHome="isHome"
              >Author</SelectItem
            >
            <SelectItem value="isbn" :class="menuItemClass" :isHome="isHome"
              >ISBN</SelectItem
            >
          </SelectGroup>
        </SelectContent>
      </Select>
      <div class="relative min-w-0 flex-1">
        <font-awesome-icon
          icon="fa-solid fa-magnifying-glass"
          class="absolute left-3 top-1/2 -translate-y-1/2 size-4"
          :class="isHome ? 'text-muted-foreground' : 'text-gr-muted'"
        />
        <Input
          v-model="searchQuery"
          type="search"
          placeholder="Search"
          aria-label="Search"
          :class="['h-11 w-full rounded-[10px] pl-9', fieldClass]"
          :isHome="isHome"
          @focus="handleFocus"
          @blur="handleBlur"
        />
        <div
          v-if="
            searchQuery.length >= 3 &&
            isInputFocused &&
            (totalResults > 0 || isSearching)
          "
          class="fixed left-4 right-4 mt-2 mb-20 border shadow-lg z-50 rounded-[10px] overflow-hidden md:left-1/2 md:right-auto md:w-[500px] md:-translate-x-1/2"
          :class="
            isHome
              ? 'border-gray-200 bg-white text-black'
              : 'border-gr-line bg-gr-surface text-gr-text'
          "
        >
          <SearchBarResults
            :searchQuery="searchQuery"
            :searchResults="searchResults"
            :totalResults="totalResults"
            :isSearching="isSearching"
            :searchType="searchType"
            :isHome="isHome"
            @search-complete="clearSearch"
          />
        </div>
      </div>
    </form>
  </div>
</template>
