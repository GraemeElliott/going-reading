<script setup lang="ts">
import type { Book } from '@/types/book';
import type { Author } from '@/types/author';
import { useRouter } from 'vue-router';
import { useDarkModeStore } from '@/store/store';

const props = defineProps<{
  result: Book | Author;
}>();

const router = useRouter();
const darkModeStore = useDarkModeStore();

const isAuthorResult = (result: Book | Author): result is Author => {
  const hasType = 'type' in result;
  const isAuthor = hasType && (result as Author).type === 'author';
  return isAuthor;
};

const handleClick = async () => {
  if (isAuthorResult(props.result)) {
    const authorPath = encodeURIComponent(props.result.name);
    await router.push(`/author/${authorPath}`);
  } else {
    await router.push(`/book/${props.result.isbn}`);
  }
};
</script>

<template>
  <div
    @click="handleClick"
    class="flex items-center p-4 cursor-pointer rounded-lg border hover:shadow-md transition-shadow"
    :class="{
      'bg-white border-gray-200': !darkModeStore.darkMode,
      'bg-gray-800 border-gray-700': darkModeStore.darkMode,
    }"
  >
    <template v-if="isAuthorResult(result)">
      <div class="relative w-16 h-20 mr-4">
        <font-awesome-icon
          icon="fa-solid fa-user"
          class="w-full h-full text-goingTeal absolute inset-0"
        />
      </div>
      <div>
        <p class="font-semibold text-xl">{{ result.name }}</p>
        <p class="text-sm text-gray-600 dark:text-gray-400">Author</p>
      </div>
    </template>

    <template v-else>
      <img
        :src="result.image"
        :alt="result.title"
        class="w-16 h-20 object-cover rounded mr-4"
      />
      <div>
        <p class="font-semibold text-lg">{{ result.title }}</p>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          by {{ result.authors.join(', ') }}
        </p>
        <p v-if="result.date_published" class="text-sm text-gray-500">
          Published: {{ result.date_published }}
        </p>
      </div>
    </template>
  </div>
</template>
