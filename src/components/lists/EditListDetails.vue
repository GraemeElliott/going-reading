<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useListsStore } from '@/store/lists-store';
import { useDarkModeStore } from '@/store/store';
import type { List } from '@/types/list';

const props = defineProps<{
  list: List;
}>();

const listsStore = useListsStore();
const darkModeStore = useDarkModeStore();
const name = ref(props.list.name);
const details = ref(props.list.details || '');
const isPopoverOpen = ref(false);

const handleSubmit = async () => {
  try {
    await listsStore.editListDetails(props.list.id, name.value, details.value);
    isPopoverOpen.value = false;
  } catch (error) {
    console.error('Failed to update list details:', error);
  }
};
</script>

<template>
  <Popover v-model:open="isPopoverOpen">
    <PopoverTrigger as-child>
      <Button
        size="sm"
        class="hover:bg-goingTeal hover:text-white"
        :class="{
          'bg-white text-black': !darkModeStore.darkMode,
          'bg-gray-900 text-white border border-white': darkModeStore.darkMode,
        }"
      >
        <font-awesome-icon icon="fa-regular fa-pen-to-square" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-80">
      <form @submit.prevent="handleSubmit" class="grid gap-4">
        <div class="space-y-2">
          <div class="flex flex-row justify-between">
            <h4 class="font-medium leading-none">Edit List Details</h4>
            <font-awesome-icon
              icon="fa-solid fa-xmark"
              @click="isPopoverOpen = false"
              class="hover:cursor-pointer"
            />
          </div>

          <p class="text-sm text-muted-foreground">
            Update your list name and details.
          </p>
        </div>
        <div class="grid gap-2">
          <label for="name" class="text-sm font-medium leading-none"
            >Name</label
          >
          <Input id="name" v-model="name" placeholder="List name" />
        </div>
        <div class="grid gap-2">
          <label for="details" class="text-sm font-medium leading-none"
            >Details</label
          >
          <Textarea
            id="details"
            v-model="details"
            placeholder="Add some details about your list..."
          />
        </div>
        <Button type="submit">Save changes</Button>
      </form>
    </PopoverContent>
  </Popover>
</template>
