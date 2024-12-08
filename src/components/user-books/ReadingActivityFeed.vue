<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../store/auth-store';
import {
  ReadingActivityService,
  ActivityType,
} from '../../services/activityService';
import { formatDistanceToNow } from 'date-fns';

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
const activities = ref<Activity[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const getActivityMessage = (activity: Activity): string => {
  const { activity_type, metadata } = activity;
  const bookTitle = metadata.bookTitle ? `"${metadata.bookTitle}"` : 'a book';

  switch (activity_type) {
    case ActivityType.BOOK_ADDED:
      return `Added ${bookTitle} to your ${metadata.newStatus} list`;
    case ActivityType.BOOK_STATUS_CHANGED:
      return `Moved ${bookTitle} from ${metadata.oldStatus} to ${metadata.newStatus}`;
    case ActivityType.BOOK_PROGRESS_UPDATED:
      return `Updated progress on ${bookTitle} to page ${metadata.currentPage} of ${metadata.totalPages}`;
    case ActivityType.BOOK_RATED:
      return `Rated ${bookTitle} ${metadata.rating} stars`;
    case ActivityType.BOOK_DELETED:
      return `Removed ${bookTitle} from your books`;
    case ActivityType.BOOK_ADDED_TO_LIST:
      return `Added ${bookTitle} to list: ${metadata.listName}`;
    case ActivityType.BOOK_REMOVED_FROM_LIST:
      return `Removed ${bookTitle} from list: ${metadata.listName}`;
    case ActivityType.LIST_DELETED:
      return `Deleted list: ${metadata.listName}`;
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
    activities.value = await ReadingActivityService.getUserActivities(
      authStore.user.id
    );
  } catch (err: any) {
    error.value = err.message;
    console.error('Error fetching activities:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchActivities();
});
</script>

<template>
  <div class="space-y-4">
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

    <div v-else class="space-y-2">
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
      >
        <p class="text-sm">{{ getActivityMessage(activity) }}</p>
        <p class="text-xs text-muted-foreground mt-1">
          {{ getTimeAgo(activity.created_at) }}
        </p>
      </div>
    </div>
  </div>
</template>
