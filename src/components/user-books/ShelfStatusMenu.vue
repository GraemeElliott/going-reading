<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  DropdownMenuContent,
  DropdownMenuItemIndicator,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'radix-vue';
import type { BookBasicInfo, BookStatus } from '@/types/book';
import { STATUS_DISPLAY_NAMES } from '@/types/book';
import { useUserBooksStore } from '@/store/user-books-store';

// Shelf status button + menu, shared by the Bookshelves and Library cards.
// `compact` draws a 32px pill (hit area still 44px) to sit in a card footer.
const props = defineProps<{
  book: BookBasicInfo;
  /** Current shelf, or '' when the book isn't on one */
  status: BookStatus;
  compact?: boolean;
  /** Append reading progress to "Currently Reading" (e.g. "· 54%") */
  showProgress?: boolean;
}>();

const emit = defineEmits<{
  (e: 'error', message: string | null): void;
}>();

const STATUSES: BookStatus[] = [
  'want-to-read',
  'currently-reading',
  'read',
  'did-not-finish',
];

const userBooksStore = useUserBooksStore();
const isUpdating = ref(false);

// As on the other screens, a book that has been read can't be moved to another shelf
const isRead = computed(() => props.status === 'read');

const label = computed(() => {
  if (!props.status) return 'Add to shelf';
  let text = STATUS_DISPLAY_NAMES[props.status];
  if (props.showProgress && props.status === 'currently-reading') {
    const book = userBooksStore.userBooks.find((b) => b.isbn === props.book.isbn);
    if (book?.pages && book.current_page) {
      text += ` · ${Math.min(100, Math.floor((book.current_page / book.pages) * 100))}%`;
    }
  }
  return text;
});

const handleStatusChange = async (value: string) => {
  const newStatus = value as BookStatus;
  if (isUpdating.value || newStatus === props.status) return;

  emit('error', null);
  isUpdating.value = true;

  try {
    await userBooksStore.updateBookStatus(props.book, newStatus);
  } catch (err: any) {
    emit('error', 'Failed to update status. Please try again.');
    console.error('Failed to update book status:', err);
  } finally {
    isUpdating.value = false;
  }
};
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger
      v-if="compact"
      class="group/status relative inline-flex h-8 max-w-full items-center after:absolute after:-inset-x-1.5 after:-inset-y-1.5 after:content-[''] focus-visible:outline-none disabled:opacity-60"
      :aria-label="
        status
          ? `Shelf: ${STATUS_DISPLAY_NAMES[status]}. Change shelf`
          : 'Not on a shelf. Add to a shelf'
      "
      :disabled="isUpdating"
    >
      <span
        class="inline-flex h-8 max-w-full items-center gap-2 rounded-full px-2.5 text-sm font-semibold transition-colors group-focus-visible/status:ring-2 group-focus-visible/status:ring-gr-accent"
        :class="
          status
            ? 'bg-gr-accent-soft text-gr-accent'
            : 'bg-gr-surface-2 group-hover/status:bg-gr-line'
        "
      >
        <font-awesome-icon v-if="!status" icon="fa-solid fa-plus" class="text-xs text-gr-muted" />
        <span class="truncate">{{ status ? STATUS_DISPLAY_NAMES[status] : 'Add to shelf' }}</span>
        <font-awesome-icon icon="fa-solid fa-chevron-down" class="text-[10px] opacity-70" />
      </span>
    </DropdownMenuTrigger>
    <DropdownMenuTrigger
      v-else
      class="gr-btn"
      :class="status ? 'bg-gr-accent-soft text-gr-accent' : 'gr-btn-outline'"
      :disabled="isUpdating"
    >
      <font-awesome-icon v-if="!status" icon="fa-solid fa-plus" />
      {{ label }}
      <font-awesome-icon
        icon="fa-solid fa-chevron-down"
        class="text-xs"
        :class="{ 'text-gr-muted': !status }"
      />
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        align="start"
        :side-offset="6"
        :collision-padding="16"
        class="gr-panel z-50 w-[230px] p-1.5"
      >
        <DropdownMenuRadioGroup
          :model-value="status"
          @update:model-value="handleStatusChange"
        >
          <DropdownMenuRadioItem
            v-for="s in STATUSES"
            :key="s"
            :value="s"
            :disabled="isRead && s !== 'read'"
            class="flex h-11 cursor-pointer select-none items-center gap-2 rounded-lg px-3 outline-none data-[disabled]:cursor-not-allowed data-[highlighted]:bg-gr-surface-2 data-[state=checked]:font-[650] data-[state=checked]:text-gr-accent data-[disabled]:opacity-50"
          >
            <span class="flex w-4 justify-center">
              <DropdownMenuItemIndicator>
                <font-awesome-icon icon="fa-solid fa-check" class="text-sm" />
              </DropdownMenuItemIndicator>
            </span>
            {{ STATUS_DISPLAY_NAMES[s] }}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <p v-if="isRead" class="px-3 pb-1.5 pt-1 text-[13px] text-gr-muted">
          Finished books stay on Read.
        </p>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
