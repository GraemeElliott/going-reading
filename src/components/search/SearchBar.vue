<script setup lang="ts">
import { ref, watch } from 'vue';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import isbndbService from '@/services/isbndbService';
import type { Book } from '@/types/book';
import type { Author } from '@/types/author';
import { debounce } from 'lodash';
import SearchBarResults from '@/components/search/SearchBarResults.vue';
import { useDarkModeStore } from '@/store/store';

type SearchType = 'title' | 'author' | 'isbn';

const searchTypes: SearchType[] = ['title', 'author', 'isbn'];

const darkModeStore = useDarkModeStore();
const searchQuery = ref<string>('');
const searchResults = ref<(Book | Author)[]>([]);
const isSearching = ref(false);
const totalResults = ref(0);
const isInputFocused = ref(false);
const searchType = ref<SearchType>('title');
const searchContainer = ref<HTMLDivElement | null>(null);

const emit = defineEmits(['search-complete']);

const performSearch = debounce(async (newQuery: string) => {
  if (!newQuery || newQuery.length < 3) {
    searchResults.value = [];
    isSearching.value = false;
    totalResults.value = 0;
    return;
  }

  isSearching.value = true;

  try {
    const data = await isbndbService.searchQuery(newQuery, searchType.value);
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

// Watch for changes in searchQuery
watch(searchQuery, (newQuery) => {
  searchResults.value = [];
  totalResults.value = 0;
  performSearch(newQuery);
});

// Watch for changes in searchType
watch(searchType, () => {
  clearSearch();
});
</script>

<template>
  <div class="relative w-full" ref="searchContainer">
    <div class="flex gap-2">
      <Select :model-value="searchType" @update:model-value="setSearchType">
        <SelectTrigger class="w-[100px]">
          <SelectValue
            :placeholder="
              searchType.charAt(0).toUpperCase() + searchType.slice(1)
            "
          />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="title"> Title </SelectItem>
            <SelectItem value="author"> Author </SelectItem>
            <SelectItem value="isbn"> ISBN </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <div class="relative flex-1">
        <font-awesome-icon
          icon="fa-solid fa-magnifying-glass"
          class="absolute left-2 top-3 size-4 text-muted-foreground"
        />
        <Input
          v-model="searchQuery"
          type="search"
          placeholder="Search"
          class="pl-8 w-full"
          @focus="handleFocus"
          @blur="handleBlur"
        />
        <!-- Search Results -->
        <div
          v-if="
            searchQuery.length >= 3 &&
            isInputFocused &&
            (totalResults > 0 || isSearching)
          "
          class="absolute w-full left-0 right-0 mt-2 border border-gray-200 shadow-lg z-50 rounded-md overflow-hidden"
          :class="{
            'bg-white text-black': !darkModeStore.darkMode,
            'bg-gray-900 text-white hover:bg-gray-900': darkModeStore.darkMode,
          }"
        >
          <SearchBarResults
            :searchQuery="searchQuery"
            :searchResults="searchResults"
            :totalResults="totalResults"
            :isSearching="isSearching"
            :searchType="searchType"
            @search-complete="clearSearch"
          />
        </div>
      </div>
    </div>
  </div>
</template>
