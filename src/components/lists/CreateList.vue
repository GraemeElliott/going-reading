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
import { useForm, useField } from 'vee-validate';
import { listDetailsFormSchema } from '@/store/form-validation-schemas';
import { toast } from '@/components/ui/toast';

const emit = defineEmits<{
  (e: 'list-created', listId: string): void;
}>();

const listsStore = useListsStore();
const isPopoverOpen = ref(false);

const { handleSubmit } = useForm({
  validationSchema: listDetailsFormSchema,
  initialValues: {
    name: '',
    details: '',
  },
});

const { value: nameValue, errorMessage: nameError } = useField<string>('name');
const { value: detailsValue, errorMessage: detailsError } =
  useField<string>('details');

const onSubmit = handleSubmit(async (values) => {
  try {
    const newList = await listsStore.createList(values.name, values.details);
    nameValue.value = '';
    detailsValue.value = '';
    toast({
      title: 'New list created',
      description: 'You have created a new list.',
      variant: 'success',
      duration: 3000,
    });
    isPopoverOpen.value = false;
    emit('list-created', newList.id);
  } catch (error) {
    toast({
      title: `Error`,
      description: `You have failed to create a new list: ${error}.`,
      variant: 'destructive',
      duration: 3000,
    });
  }
});
</script>

<template>
  <Popover v-model:open="isPopoverOpen">
    <PopoverTrigger as-child>
      <button
        type="button"
        class="flex min-h-[78px] w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-gr-line font-medium text-gr-muted transition-colors hover:border-gr-accent hover:text-gr-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gr-accent"
      >
        <font-awesome-icon icon="fa-solid fa-plus" />
        Create List
      </button>
    </PopoverTrigger>
    <PopoverContent
      class="w-80 rounded-2xl border-gr-line bg-gr-surface font-body text-gr-text"
      :auto-focus="false"
    >
      <form @submit.prevent="onSubmit" class="grid gap-4">
        <div class="space-y-2">
          <div class="flex flex-row items-center justify-between">
            <h4 class="font-medium leading-none">Create New List</h4>
            <button
              type="button"
              aria-label="Close"
              class="-m-3 flex h-11 w-11 items-center justify-center rounded-[10px] text-gr-muted transition-colors hover:bg-gr-surface-2 hover:text-gr-text"
              @click="isPopoverOpen = false"
            >
              <font-awesome-icon icon="fa-solid fa-xmark" />
            </button>
          </div>
          <p class="text-sm text-gr-muted">
            Create a new list to organise your books.
          </p>
        </div>
        <div class="grid gap-2">
          <label for="name" class="text-sm font-medium leading-none"
            >Name</label
          >
          <Input
            id="name"
            v-model="nameValue"
            name="name"
            placeholder="List name"
            :auto-focus="false"
          />
          <span v-if="nameError" class="text-sm text-destructive">{{
            nameError
          }}</span>
        </div>
        <div class="grid gap-2">
          <label for="details" class="text-sm font-medium leading-none"
            >Details</label
          >
          <Textarea
            id="details"
            v-model="detailsValue"
            name="details"
            placeholder="Add some details about your list..."
          />
          <span v-if="detailsError" class="text-sm text-destructive">{{
            detailsError
          }}</span>
        </div>
        <Button
          type="submit"
          class="h-11 rounded-[10px] border-transparent bg-gr-accent text-gr-accent-ink hover:border-transparent hover:bg-gr-accent hover:text-gr-accent-ink hover:opacity-90"
          >Create List</Button
        >
      </form>
    </PopoverContent>
  </Popover>
</template>
<style scoped>
form :deep(input),
form :deep(textarea) {
  @apply rounded-[10px] border-gr-line bg-gr-surface-2 text-gr-text placeholder:text-gr-muted !important;
}
form :deep(input) {
  @apply h-11 !important;
}
</style>
