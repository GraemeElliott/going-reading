<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from '../../store/auth-store';
import {
  ReadingActivityService,
  ActivityType,
} from '../../services/activityService';
import { formatDistanceToNow } from 'date-fns';
import StarRating from '../../components/partials/StarRating.vue';
import { useDarkModeStore } from '@/store/store';

const props = defineProps<{
  isbn: string;
}>();

interface Activity {
  id: string;
  activity_type: ActivityType;
  book_isbn: string | null;
  metadata: {
    bookTitle?: string;
    oldStatus?: string;
    newStatus?: string;
    currentPage?: number;
    totalPages?: number;
    rating?: number;
    listName?: string;
  };
  created_at: string;
}

const authStore = useAuthStore();
const darkModeStore = useDarkModeStore();
const activities = ref<Activity[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const formatBookStatus = (status: string): string => {
  if (!status) return '';
  return status
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getActivityIcon = (activity: Activity): string => {
  const { activity_type, metadata } = activity;

  // Special case for finishing a book
  if (
    activity_type === ActivityType.BOOK_STATUS_CHANGED &&
    metadata.oldStatus === 'currently-reading' &&
    metadata.newStatus === 'read'
  ) {
    return '🎉';
  }

  switch (activity_type) {
    case ActivityType.BOOK_STATUS_CHANGED:
      return 'fa-solid fa-arrow-turn-up';
    case ActivityType.BOOK_PROGRESS_UPDATED:
      return 'fa-solid fa-bookmark';
    case ActivityType.BOOK_TOTAL_PAGES_UPDATED:
      return 'fa-solid fa-book-open';
    case ActivityType.BOOK_RATED:
      return 'fa-solid fa-star';
    case ActivityType.BOOK_DELETED:
    case ActivityType.BOOK_REMOVED_FROM_LIST:
    case ActivityType.LIST_DELETED:
      return 'fa-solid fa-minus';
    case ActivityType.BOOK_ADDED:
    case ActivityType.BOOK_ADDED_TO_LIST:
      return 'fa-solid fa-plus';
    case ActivityType.BOOK_STATUS_CHANGED:
      return 'fa-solid fa-bookmark';
    default:
      return 'fa-solid fa-bookmark';
  }
};

const isEmojiIcon = (icon: string): boolean => {
  return icon.includes('🎉');
};

const getActivityMessage = (activity: Activity): string | null => {
  const { activity_type, metadata } = activity;

  switch (activity_type) {
    case ActivityType.BOOK_ADDED:
      return `Added to your <strong>${formatBookStatus(
        metadata.newStatus || ''
      )}</strong> list`;
    case ActivityType.BOOK_STATUS_CHANGED:
      return `Moved from <strong>${formatBookStatus(
        metadata.oldStatus || ''
      )}</strong> to <strong>${formatBookStatus(
        metadata.newStatus || ''
      )}</strong>`;
    case ActivityType.BOOK_PROGRESS_UPDATED:
      return `Updated progress to page <strong>${metadata.currentPage}</strong> of ${metadata.totalPages}`;
    case ActivityType.BOOK_TOTAL_PAGES_UPDATED:
      return `Total pages updated to <strong>${metadata.totalPages}</strong>`;
    case ActivityType.BOOK_RATED:
      return `Rated`;
    case ActivityType.BOOK_DELETED:
      return `Removed from your books`;
    case ActivityType.BOOK_ADDED_TO_LIST:
      return `Added to list: <strong>${metadata.listName}</strong>`;
    case ActivityType.BOOK_REMOVED_FROM_LIST:
      return `Removed from list: <strong>${metadata.listName}</strong>`;
    default:
      return 'Unknown activity';
  }
};

const getTimeAgo = (date: string): string => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

const fetchActivities = async () => {
  if (!authStore.user) return;

  try {
    loading.value = true;
    error.value = null;
    const allActivities = await ReadingActivityService.getUserActivities(
      authStore.user.id
    );
    // Filter activities for this specific book
    activities.value = allActivities.filter(
      (activity) => activity.book_isbn === props.isbn
    );
  } catch (err: any) {
    error.value = err.message;
    console.error('Error fetching activities:', err);
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.isbn,
  () => {
    fetchActivities();
  }
);

onMounted(() => {
  fetchActivities();
});
</script>

<template>
  <div class="space-y-4 mt-8">
    <h3 class="text-lg font-medium">Reading Activity</h3>

    <div v-if="loading" class="text-center py-4">
      <div class="animate-spin h-6 w-6 mx-auto"></div>
    </div>

    <div v-else-if="error" class="text-center py-4 text-red-500">
      {{ error }}
    </div>

    <div
      v-else-if="activities.length === 0"
      class="text-center py-4 text-muted-foreground"
    >
      No reading activity yet.
    </div>

    <div v-else class="relative">
      <!-- Timeline line -->
      <div
        class="absolute left-1/2 transform -translate-x-1/2 h-full w-px bg-gray-200"
      ></div>

      <!-- Timeline items -->
      <div class="space-y-8">
        <div
          v-for="(activity, index) in activities"
          :key="activity.id"
          class="relative"
        >
          <!-- Timeline icon -->
          <div
            :class="[
              'absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full border-2 border-gray-200 z-10 flex items-center justify-center',
              darkModeStore.darkMode ? 'bg-gray-900' : 'bg-white',
            ]"
          >
            <template v-if="isEmojiIcon(getActivityIcon(activity))">
              {{ getActivityIcon(activity) }}
            </template>
            <font-awesome-icon
              v-else
              :icon="getActivityIcon(activity)"
              class="text-goingTeal"
            />
          </div>

          <!-- Content container -->
          <div
            class="flex items-center justify-between w-full"
            :class="index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'"
          >
            <!-- Activity content -->
            <div
              class="w-[calc(50%-0.25rem)]"
              :class="index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'"
            >
              <div class="p-4 rounded-lg border shadow-sm">
                <div
                  class="flex items-center gap-2"
                  :class="index % 2 === 0 ? 'justify-end' : 'justify-start'"
                >
                  <p
                    class="text-xs md:text-sm"
                    v-html="getActivityMessage(activity)"
                  ></p>
                  <StarRating
                    v-if="activity.activity_type === ActivityType.BOOK_RATED"
                    :model-value="activity.metadata.rating"
                    readonly
                  />
                </div>
                <p
                  class="text-xs text-muted-foreground mt-1"
                  :class="index % 2 === 0 ? 'text-right' : 'text-left'"
                >
                  {{ getTimeAgo(activity.created_at) }}
                </p>
              </div>
            </div>

            <!-- Empty space for the other side -->
            <div class="w-[calc(50%-0.25rem)]"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
