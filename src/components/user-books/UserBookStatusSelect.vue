<script setup lang="ts">
import { computed, ref } from 'vue';
import type { BookStatus, BookBasicInfo } from '@/types/book';
import { useUserBooksStore } from '@/store/user-books-store';
import { useAuthStore } from '@/store/auth-store';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const props = defineProps<{
  modelValue?: BookStatus;
  book: BookBasicInfo;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: BookStatus): void;
}>();

const userBooksStore = useUserBooksStore();
const authStore = useAuthStore();
const isUpdating = ref(false);

// Changed from ref to computed to make it reactive to store changes
const currentStatus = computed<BookStatus>(
  () =>
    props.modelValue || userBooksStore.getUserBookStatus(props.book.isbn) || ''
);

const isAuthenticated = computed(() => !!authStore.user);
const isRead = computed(() => currentStatus.value === 'read');

const getStatusClass = (status: BookStatus) => {
  const classes = {
    'want-to-read': '!bg-goingTeal !text-white hover:!bg-goingTeal/90',
    'currently-reading': '!bg-goingYellow !text-black hover:!bg-goingYellow/90',
    read: '!bg-green-600 !text-white hover:!bg-green-600/90',
    'did-not-finish': '!bg-goingRed !text-white hover:!bg-goingRed/90',
  };
  return status ? classes[status] : '';
};

const getDisplayText = (status: BookStatus) => {
  if (!isAuthenticated.value) return 'Sign in to track';
  if (isUpdating.value) return 'Updating...';

  const displayNames = {
    'want-to-read': 'Want To Read',
    'currently-reading': 'Currently Reading',
    read: 'Read',
    'did-not-finish': 'Did Not Finish',
    '': 'Select A Status',
  };
  return displayNames[status];
};

const handleStatusChange = async (value: string) => {
  const newStatus = value as BookStatus;
  if (newStatus === currentStatus.value) return;

  isUpdating.value = true;
  try {
    emit('update:modelValue', newStatus);
    await userBooksStore.updateBookStatus(props.book, newStatus);
  } catch (error) {
    // Revert on error
    emit('update:modelValue', currentStatus.value);
    console.error('Failed to update status:', error);
  } finally {
    isUpdating.value = false;
  }
};
</script>

<template>
  <Select
    :model-value="currentStatus"
    @update:model-value="handleStatusChange"
    :disabled="disabled || !isAuthenticated || isRead || isUpdating"
  >
    <SelectTrigger
      class="w-[180px] flex items-center justify-center transition-colors duration-200"
      :class="[
        getStatusClass(currentStatus),
        currentStatus && '!border-0',
        (isRead || isUpdating) && 'cursor-not-allowed opacity-90',
      ]"
    >
      <SelectValue :placeholder="getDisplayText(currentStatus)" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectItem
          value="want-to-read"
          :disabled="isRead"
          :class="{ 'opacity-50 cursor-not-allowed': isRead }"
        >
          Want To Read
        </SelectItem>
        <SelectItem
          value="currently-reading"
          :disabled="isRead"
          :class="{ 'opacity-50 cursor-not-allowed': isRead }"
        >
          Currently Reading
        </SelectItem>
        <SelectItem value="read">Read</SelectItem>
        <SelectItem
          value="did-not-finish"
          :disabled="isRead"
          :class="{ 'opacity-50 cursor-not-allowed': isRead }"
        >
          Did Not Finish
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
