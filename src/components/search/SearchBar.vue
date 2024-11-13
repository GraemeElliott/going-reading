<script setup lang="ts">
// import { ref, watch, reactive } from 'vue';
// import { Input } from '@/components/ui/input';
// import {
//   Select,
//   SelectContent,
//   SelectGroup,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import isbndbService from '@/services/isbndbService';
// import { debounce } from 'lodash';
// import type { Book } from '@/types/book';
// import type { Author } from '@/types/author';
// import { useRouter } from 'vue-router';
// import { useDarkModeStore } from '@/store/store';
// import { useAuthorPhoto } from '@/composables/useAuthorPhoto';

// type SearchType = 'title' | 'author' | 'isbn';

// const searchTypes: SearchType[] = ['title', 'author', 'isbn'];

// const router = useRouter();
// const searchQuery = ref<string>('');
// const searchResults = ref<(Book | Author)[]>([]);
// const isSearching = ref(false);
// const totalResults = ref(0);
// const darkModeStore = useDarkModeStore();
// const isInputFocused = ref(false);
// const searchType = ref<SearchType>('title');

// interface AuthorPhotoState {
//   photoUrl: string;
//   isLoading: boolean;
//   photoError: boolean;
// }

// Keep track of author photos
// const authorPhotoStates = reactive(new Map<string, AuthorPhotoState>());

// const emit = defineEmits(['search-complete']);

// const performSearch = debounce(async (newQuery: string) => {
//   if (!newQuery || newQuery.length < 3) {
//     searchResults.value = [];
//     isSearching.value = false;
//     totalResults.value = 0;
//     return;
//   }

//   isSearching.value = true;
//   try {
//     const data = await isbndbService.searchQuery(newQuery, searchType.value);
//     totalResults.value = data.length;
//     searchResults.value = data.slice(0, 5);

//     // Initialize photos for all authors immediately
//     searchResults.value.forEach((result) => {
//       if (isAuthorResult(result) && !authorPhotoStates.has(result.name)) {
//         const { photoUrl, isLoading, photoError, fetchAuthorPhoto } =
//           useAuthorPhoto();

//         // Create a reactive state object for this author
//         authorPhotoStates.set(result.name, {
//           photoUrl: '',
//           isLoading: true,
//           photoError: false,
//         });

//         // Watch for changes in the composable's state
//         watch(
//           [photoUrl, isLoading, photoError],
//           ([newUrl, newLoading, newError]) => {
//             if (authorPhotoStates.has(result.name)) {
//               authorPhotoStates.set(result.name, {
//                 photoUrl: newUrl,
//                 isLoading: newLoading,
//                 photoError: newError,
//               });
//             }
//           }
//         );

//         // Start fetching the photo
//         fetchAuthorPhoto(result.name);
//       }
//     });
//   } catch (error) {
//     console.error('Search error:', error);
//     searchResults.value = [];
//     totalResults.value = 0;
//   } finally {
//     isSearching.value = false;
//   }
// }, 500);

// const handleResultClick = async (result: Book | Author) => {
//   clearSearch();
//   emit('search-complete');

//   if (isAuthorResult(result)) {
//     const authorPath = encodeURIComponent(result.name);
//     await router.push(`/author/${authorPath}`);
//   } else {
//     await router.push(`/book/${result.isbn}`);
//     if (router.currentRoute.value.name === 'book-details') {
//       window.location.reload();
//     }
//   }
// };

// const handleSeeMore = () => {
//   const query = searchQuery.value;
//   clearSearch();
//   emit('search-complete');
//   router.push({
//     name: 'search-results',
//     query: { q: query, type: searchType.value },
//   });
// };

// const clearSearch = () => {
//   searchQuery.value = '';
//   searchResults.value = [];
//   totalResults.value = 0;
//   authorPhotoStates.clear();
// };

// const isAuthorResult = (result: Book | Author): result is Author => {
//   const hasType = 'type' in result;
//   const isAuthor = hasType && (result as Author).type === 'author';
//   return isAuthor;
// };

// const handleFocus = () => {
//   isInputFocused.value = true;
// };

// const handleBlur = () => {
//   isInputFocused.value = false;
// };

// const setSearchType = (value: string) => {
//   if (searchTypes.includes(value as SearchType)) {
//     searchType.value = value as SearchType;
//     if (searchQuery.value.length >= 3) {
//       performSearch(searchQuery.value);
//     }
//   }
// };

// const getAuthorPhotoState = (authorName: string) => {
//   return authorPhotoStates.get(authorName);
// };

// watch(searchQuery, (newQuery) => {
//   performSearch(newQuery);
// });

// // Expose the clearSearch method
// defineExpose({
//   clearSearch,
// });
</script>

<template>
  <div class="w-full">
    <!-- <div class="relative flex gap-2"> -->
    <!-- Search Type Select -->
    <!-- <Select :model-value="searchType" @update:model-value="setSearchType">
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
        <div v-if="isSearching" class="absolute right-2 top-2">
          <div
            class="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"
          ></div>
        </div>
      </div> -->

    <!-- Search Results -->
    <!-- <div
        v-if="
          searchQuery.length >= 3 && (searchResults.length > 0 || isSearching)
        "
        class="absolute top-full mt-2 w-full border border-gray-200 shadow-md z-10 rounded-md overflow-hidden"
        :class="{
          'bg-white text-black': !darkModeStore.darkMode,
          'bg-gray-900 text-white': darkModeStore.darkMode,
        }"
      >
        <ul>
          <li
            v-for="result in searchResults"
            :key="isAuthorResult(result) ? result.name : result.isbn"
            class="flex items-center p-2 cursor-pointer border-b border-gray-100 last:border-b-0"
            :class="{
              'hover:bg-white hover:text-black': darkModeStore.darkMode,
              'hover:bg-gray-100 hover:text-black': !darkModeStore.darkMode,
            }"
            @click="handleResultClick(result)"
          >
            <template v-if="isAuthorResult(result)">
              <div class="flex items-center w-full">
                <div
                  v-if="getAuthorPhotoState(result.name)?.isLoading"
                  class="w-10 h-10 mr-3"
                >
                  <div
                    class="w-full h-full animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full"
                  ></div>
                </div>
                <template v-else>
                  <div class="w-10 h-10 mr-3 relative">
                    <img
                      v-if="
                        getAuthorPhotoState(result.name)?.photoUrl &&
                        !getAuthorPhotoState(result.name)?.photoError
                      "
                      :src="getAuthorPhotoState(result.name)?.photoUrl"
                      :alt="result.name"
                      class="w-full h-full rounded-full object-cover transition-opacity duration-200"
                      @error="
                        () => {
                          const state = getAuthorPhotoState(result.name);
                          if (state) {
                            authorPhotoStates.set(result.name, {
                              ...state,
                              photoError: true,
                            });
                          }
                        }
                      "
                    />
                    <font-awesome-icon
                      v-else
                      icon="fa-solid fa-user"
                      class="w-full h-full text-goingTeal absolute inset-0"
                    />
                  </div>
                </template>
                <div>
                  <p class="font-semibold text-lg">{{ result.name }}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Author</p>
                </div>
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
                <p class="text-sm">by {{ result.authors.join(', ') }}</p>
              </div>
            </template>
          </li>
        </ul>

        <div
          v-if="totalResults > 5"
          class="text-center border-t border-gray-100"
        >
          <button
            @click="handleSeeMore"
            class="w-full py-3 font-medium text-sm transition-colors"
            :class="{
              'hover:bg-white hover:text-black': darkModeStore.darkMode,
              'hover:bg-gray-100 hover:text-black': !darkModeStore.darkMode,
            }"
          >
            See more results
          </button>
        </div>
      </div>
    </div> -->
  </div>
</template>
