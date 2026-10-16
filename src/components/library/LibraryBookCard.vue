<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  PopoverClose,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from 'radix-vue';
import type { LibraryEntry, LibraryFormat } from '@/types/library';
import { LIBRARY_FORMATS } from '@/types/library';
import { useLibraryStore } from '@/store/library-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { SHELF_STATUS_META } from '@/components/user-books/shelfStatusMeta';
import { toast } from '@/components/ui/toast';
import BookTitle from '@/components/partials/BookTitle.vue';
import { formatAuthors, formatBookTitle } from '@/utils/book-display';
import { FORMAT_META, formatLibraryDate, todayStr } from './formatMeta';

const props = defineProps<{
  entry: LibraryEntry;
}>();

const libraryStore = useLibraryStore();
const userBooksStore = useUserBooksStore();

// Shelf status lives on user_books (reactive, so it follows changes made
// elsewhere). No label when the book isn't on a shelf.
const shelfBook = computed(() =>
  userBooksStore.userBooks.find((b) => b.isbn === props.entry.isbn)
);
const shelfLabel = computed(() => {
  const book = shelfBook.value;
  if (!book?.status) return null;
  const meta = SHELF_STATUS_META[book.status];
  let text = meta.label;
  if (book.status === 'currently-reading' && book.pages && book.current_page) {
    text += ` · ${Math.min(100, Math.floor((book.current_page / book.pages) * 100))}%`;
  }
  return { ...meta, text, status: book.status };
});
const saving = ref(false);
const showLastFormatHint = ref(false);
const dateDraft = ref(props.entry.date_added);
const datePopoverOpen = ref(false);

const formatLabel = computed(() =>
  props.entry.formats.map((f) => FORMAT_META[f].label).join(' + ')
);

const toastError = (title: string, err: unknown) =>
  toast({
    title,
    description: (err as Error)?.message || 'Please try again.',
    variant: 'destructive',
    duration: 4000,
  });

const toggleFormat = async (format: LibraryFormat, checked: boolean) => {
  const next = checked
    ? [...props.entry.formats, format]
    : props.entry.formats.filter((f) => f !== format);
  // Keep the last format ticked; removing the book is a separate action
  if (!next.length) {
    showLastFormatHint.value = true;
    return;
  }
  showLastFormatHint.value = false;
  saving.value = true;
  try {
    await libraryStore.updateFormats(props.entry.id, next);
  } catch (err) {
    toastError('Error updating format', err);
  } finally {
    saving.value = false;
  }
};

const onMenuOpenChange = (open: boolean) => {
  if (!open) showLastFormatHint.value = false;
};

const onDatePopoverChange = (open: boolean) => {
  datePopoverOpen.value = open;
  if (open) dateDraft.value = props.entry.date_added;
};

const saveDate = async () => {
  if (!dateDraft.value || dateDraft.value === props.entry.date_added) {
    datePopoverOpen.value = false;
    return;
  }
  try {
    await libraryStore.updateDateAdded(props.entry.id, dateDraft.value);
    datePopoverOpen.value = false;
  } catch (err) {
    toastError('Error updating date', err);
  }
};

const removeEntry = async () => {
  try {
    await libraryStore.removeEntry(props.entry.id);
    toast({
      title: 'Removed from library',
      description: `${props.entry.title} is no longer in your library.`,
      variant: 'success',
      duration: 2000,
    });
  } catch (err) {
    toastError('Error removing book', err);
  }
};
</script>

<template>
  <div class="gr-card flex flex-col gap-1 py-4 pl-4 pr-3">
    <div class="flex gap-4">
    <router-link
      :to="`/book/${entry.isbn}`"
      class="shrink-0"
      tabindex="-1"
      aria-hidden="true"
    >
      <img
        v-if="entry.image"
        :src="entry.image"
        alt=""
        class="h-[108px] w-[72px] rounded-[5px] object-cover shadow-gr-card"
        @error="entry.image = null"
      />
      <span
        v-else
        class="flex h-[108px] w-[72px] items-center justify-center rounded-[5px] bg-gr-surface-2 text-gr-muted"
      >
        <font-awesome-icon icon="fa-solid fa-book" class="fa-lg" />
      </span>
    </router-link>

    <div class="min-w-0 flex-1">
      <div class="flex items-start gap-2">
        <div class="min-w-0 flex-1">
          <h2 class="text-[17px] font-[650] leading-snug">
            <router-link
              :to="`/book/${entry.isbn}`"
              class="block break-words transition-colors hover:text-gr-accent"
            >
              <BookTitle :title="entry.title" />
            </router-link>
          </h2>
          <p v-if="entry.authors.length" class="mt-0.5 text-[15px] text-gr-muted">
            {{ formatAuthors(entry.authors) }}
          </p>
          <!-- Current shelf: information, links through to Bookshelves -->
          <router-link
            v-if="shelfLabel"
            :to="{ path: '/my-books/bookshelves', query: { shelf: shelfLabel.status } }"
            class="relative mt-1 inline-flex items-center gap-1.5 text-[13px] font-[650] after:absolute after:-inset-y-2 after:inset-x-0 after:content-[''] hover:underline"
            :class="shelfLabel.textClass"
            :aria-label="`Shelf: ${shelfLabel.text}. View on Bookshelves`"
          >
            <font-awesome-icon :icon="shelfLabel.icon" class="text-[15px]" />
            {{ shelfLabel.text }}
          </router-link>
        </div>

        <!-- Remove confirmation -->
        <AlertDialogRoot>
          <AlertDialogTrigger
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gr-muted transition-colors hover:bg-gr-surface-2 hover:text-gr-danger-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-gr-accent relative after:absolute after:-inset-x-1.5 after:-inset-y-1.5 after:content-['']"
            :aria-label="`Remove ${entry.title} from library`"
          >
            <font-awesome-icon icon="fa-regular fa-trash-can" />
          </AlertDialogTrigger>
          <AlertDialogPortal>
            <AlertDialogOverlay
              class="fixed inset-0 z-50 bg-gr-backdrop data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            />
            <AlertDialogContent
              class="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gr-line bg-gr-surface p-6 font-body text-base text-gr-text shadow-gr-modal focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            >
              <AlertDialogTitle class="font-heading text-[26px] font-medium leading-tight">
                Remove from library?
              </AlertDialogTitle>
              <AlertDialogDescription class="mt-3 text-gr-muted">
                <span class="font-[650] text-gr-text">{{ formatBookTitle(entry.title).main }}</span>
                will no longer be listed as a book you own. It stays on your
                shelves and in your lists.
              </AlertDialogDescription>
              <div class="mt-6 flex justify-end gap-2">
                <AlertDialogCancel class="gr-btn gr-btn-outline">Cancel</AlertDialogCancel>
                <AlertDialogAction class="gr-btn gr-btn-danger" @click="removeEntry">
                  Remove
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialogPortal>
        </AlertDialogRoot>
      </div>

    </div>
    </div>

    <!-- Footer: date added under the cover, format on the far right -->
    <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <!-- Date added (editable) -->
        <PopoverRoot :open="datePopoverOpen" @update:open="onDatePopoverChange">
          <PopoverTrigger
            class="inline-flex h-8 items-center gap-1.5 rounded !text-[13px] text-gr-muted relative after:absolute after:-inset-x-1.5 after:-inset-y-1.5 after:content-[''] transition-colors hover:text-gr-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-gr-accent"
            :aria-label="`Added ${formatLibraryDate(entry.date_added)}. Change date added`"
          >
            Added {{ formatLibraryDate(entry.date_added) }}
            <font-awesome-icon icon="fa-solid fa-pen" class="text-[10px]" />
          </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent
            align="start"
            :side-offset="6"
            :collision-padding="16"
            class="gr-panel z-50 w-[260px] p-4"
          >
            <form class="grid gap-3" @submit.prevent="saveDate">
              <label :for="`date-${entry.id}`" class="text-[15px] font-semibold">
                Date added
              </label>
              <input
                :id="`date-${entry.id}`"
                v-model="dateDraft"
                type="date"
                :max="todayStr()"
                required
                class="gr-input dark:[color-scheme:dark]"
              />
              <div class="flex justify-end gap-2">
                <PopoverClose class="gr-btn gr-btn-outline">Cancel</PopoverClose>
                <button type="submit" class="gr-btn gr-btn-primary">Save</button>
              </div>
            </form>
          </PopoverContent>
        </PopoverPortal>
        </PopoverRoot>
        <!-- Format menu -->
        <DropdownMenuRoot @update:open="onMenuOpenChange">
          <DropdownMenuTrigger
            class="group/format inline-flex h-8 max-w-full items-center focus-visible:outline-none disabled:opacity-60 relative after:absolute after:-inset-x-1.5 after:-inset-y-1.5 after:content-['']"
            :aria-label="`Format: ${formatLabel}. Change format`"
            :disabled="saving"
          >
            <span
              class="inline-flex h-8 max-w-full items-center gap-2 rounded-full bg-gr-surface-2 px-2.5 text-sm font-semibold transition-colors group-hover/format:bg-gr-line group-focus-visible/format:ring-2 group-focus-visible/format:ring-gr-accent"
            >
              <font-awesome-icon
                v-for="f in entry.formats"
                :key="f"
                :icon="FORMAT_META[f].icon"
                class="text-gr-muted"
              />
              <span class="truncate">{{ formatLabel }}</span>
              <font-awesome-icon icon="fa-solid fa-chevron-down" class="text-[10px] text-gr-muted" />
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent
              align="end"
              :side-offset="6"
              :collision-padding="16"
              class="gr-panel z-50 w-[260px] max-w-[calc(100vw-2rem)] p-1.5"
            >
              <DropdownMenuCheckboxItem
                v-for="f in LIBRARY_FORMATS"
                :key="f"
                :checked="entry.formats.includes(f)"
                class="flex min-h-[52px] cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 outline-none data-[highlighted]:bg-gr-surface-2"
                @update:checked="(checked: boolean) => toggleFormat(f, checked)"
                @select.prevent
              >
                <font-awesome-icon :icon="FORMAT_META[f].icon" class="w-4 text-gr-muted" />
                <span class="min-w-0 flex-1">
                  <span class="block font-semibold">{{ FORMAT_META[f].label }}</span>
                  <span class="block text-[13px] text-gr-muted">
                    {{ FORMAT_META[f].description }}
                  </span>
                </span>
                <font-awesome-icon
                  v-if="entry.formats.includes(f)"
                  icon="fa-solid fa-check"
                  class="text-gr-accent"
                />
              </DropdownMenuCheckboxItem>
              <p
                v-if="showLastFormatHint"
                role="status"
                class="px-3 pb-2 pt-1 text-[13px] text-gr-muted"
              >
                A book needs at least one format. To stop tracking it, remove it
                from your library.
              </p>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenuRoot>
    </div>
  </div>
</template>
