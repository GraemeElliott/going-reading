<script setup lang="ts">
import { computed, ref } from 'vue';
import PageSection from '../../components/layout/PageSection.vue';
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
  <PageSection
    title="Lists"
    :count="`${listsStore.lists.length} ${
      listsStore.lists.length === 1 ? 'list' : 'lists'
    }`"
  >
    <div
      v-if="listsStore.loading && !listsStore.lists.length"
      class="grid grid-cols-1 gap-5 md:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]"
    >
      <Skeleton
        v-for="n in 3"
        :key="n"
        class="h-[78px] rounded-2xl bg-gr-surface-2"
      />
    </div>

    <template v-else>
      <div
        v-if="listsStore.error && !listsStore.lists.length"
        class="py-4 text-center text-destructive"
      >
        {{ listsStore.error }}
      </div>

      <div
        v-else-if="isProfilePage && !listsStore.lists.length"
        class="py-4 text-center text-gr-muted"
      >
        You haven't created any lists yet.
      </div>

      <!-- The create tile is always the last item in the grid -->
      <div
        v-if="listsStore.lists.length || !isProfilePage"
        class="grid grid-cols-1 gap-5 md:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]"
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
        <CreateList v-if="!isProfilePage" @list-created="(id) => openList(id)" />
      </div>
    </template>

    <ListDialog
      v-model:open="dialogOpen"
      :list="selectedList"
      :books="selectedList ? listsStore.booksInLists[selectedList.id] : []"
      :readonly="isProfilePage"
      :mode="dialogMode"
    />
  </PageSection>
</template>
