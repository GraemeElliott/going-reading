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
import { Switch } from '@/components/ui/switch';
import { useListsStore } from '@/store/lists-store';
import { useDarkModeStore } from '@/store/store';
import { useForm, useField } from 'vee-validate';
import { listDetailsFormSchema } from '@/store/form-validation-schemas';
import { toast } from '@/components/ui/toast';

const emit = defineEmits<{
  (e: 'list-created', listId: string): void;
}>();

const listsStore = useListsStore();
const darkModeStore = useDarkModeStore();
const isPublic = ref(false);
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
    const newList = await listsStore.createList(
      values.name,
      isPublic.value,
      values.details
    );
    nameValue.value = '';
    detailsValue.value = '';
    isPublic.value = false;
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
      duration: 4000,
    });
  }
});

const handlePublicToggle = (checked: boolean) => {
  isPublic.value = checked;
};
</script>

<template>
  <Popover v-model:open="isPopoverOpen">
    <PopoverTrigger as-child>
      <Button
        class="hover:bg-goingGreen hover:border hover:border-goingGreen hover:text-white"
      >
        <font-awesome-icon icon="fa-solid fa-plus" />
        Create List
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-80" :auto-focus="false">
      <form @submit.prevent="onSubmit" class="grid gap-4">
        <div class="space-y-2">
          <div class="flex flex-row justify-between">
            <h4 class="font-medium leading-none">Create New List</h4>
            <font-awesome-icon
              icon="fa-solid fa-xmark"
              @click="isPopoverOpen = false"
              class="hover:cursor-pointer"
            />
          </div>
          <p class="text-sm text-muted-foreground">
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
          <span v-if="nameError" class="text-sm text-red-500">{{
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
          <span v-if="detailsError" class="text-sm text-red-500">{{
            detailsError
          }}</span>
        </div>
        <div class="flex items-center space-x-2">
          <Switch :checked="isPublic" @update:checked="handlePublicToggle" />
          <span class="text-sm">{{ isPublic ? 'Public' : 'Private' }}</span>
        </div>
        <Button type="submit">Create List</Button>
      </form>
    </PopoverContent>
  </Popover>
</template>
