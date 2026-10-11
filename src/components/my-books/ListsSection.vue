<script setup lang="ts">
import { computed, ref } from 'vue';
import { Separator } from '../../components/ui/separator';
import { Skeleton } from '../../components/ui/skeleton';
import { useListsStore } from '../../store/lists-store';
import ListCard from '../../components/lists/ListCard.vue';
import ListDialog from '../../components/lists/ListDialog.vue';
import CreateList from '../lists/CreateList.vue';

defineProps<{
  isProfilePage?: boolean;
}>();

const listsStore = useListsStore();
const selectedListId = ref<string | null>(null);
const dialogOpen = ref(false);
const dialogMode = ref<'view' | 'edit' | 'delete'>('view');

const selectedList = computed(
  () => listsStore.lists.find((l) => l.id === selectedListId.value) ?? null
);

const openList = (
  listId: string,
  mode: 'view' | 'edit' | 'delete' = 'view'
) => {
  selectedListId.value = listId;
  dialogMode.value = mode;
  dialogOpen.value = true;
};
</script>

<template>
  <div class="w-full">
    <div class="flex items-baseline justify-between gap-4">
      <h3 class="text-xl font-medium">Lists</h3>
      <span class="text-sm text-muted-foreground">
        {{ listsStore.lists.length }}
        {{ listsStore.lists.length === 1 ? 'list' : 'lists' }}
      </span>
    </div>
    <Separator class="my-6" />
    <div v-if="!isProfilePage" class="mb-6">
      <CreateList @list-created="(id) => openList(id)" />
    </div>

    <div
      v-if="listsStore.loading && !listsStore.lists.length"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      <Skeleton v-for="n in 3" :key="n" class="h-56 rounded-xl" />
    </div>

    <div
      v-else-if="listsStore.error && !listsStore.lists.length"
      class="text-center py-4 text-red-500"
    >
      {{ listsStore.error }}
    </div>

    <div
      v-else-if="!listsStore.lists.length"
      class="text-center py-4 text-muted-foreground"
    >
      You haven't created any lists yet.
    </div>

    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10"
    >
      <ListCard
        v-for="list in listsStore.lists"
        :key="list.id"
        :list="list"
        :books="listsStore.booksInLists[list.id]"
        :readonly="isProfilePage"
        @open="openList($event)"
        @edit="openList($event, 'edit')"
        @delete="openList($event, 'delete')"
      />
    </div>

    <ListDialog
      v-model:open="dialogOpen"
      :list="selectedList"
      :books="selectedList ? listsStore.booksInLists[selectedList.id] : []"
      :readonly="isProfilePage"
      :mode="dialogMode"
    />
  </div>
</template>
