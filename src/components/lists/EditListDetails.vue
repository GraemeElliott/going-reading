<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useListsStore } from '@/store/lists-store';
import { useDarkModeStore } from '@/store/store';
import { useForm, useField } from 'vee-validate';
import { listDetailsFormSchema } from '@/store/form-validation-schemas';
import type { List } from '@/types/list';
import { toast } from '@/components/ui/toast';

const props = defineProps<{
  list: List;
}>();

const listsStore = useListsStore();
const darkModeStore = useDarkModeStore();
const isPopoverOpen = ref(false);
const isPublic = ref(props.list.is_public);

const { handleSubmit } = useForm({
  validationSchema: listDetailsFormSchema,
  initialValues: {
    name: props.list.name,
    details: props.list.details || '',
  },
});

const { value: nameValue, errorMessage: nameError } = useField<string>('name');
const { value: detailsValue, errorMessage: detailsError } =
  useField<string>('details');

const handlePublicToggle = (checked: boolean) => {
  isPublic.value = checked;
};

const onSubmit = handleSubmit(async (values) => {
  try {
    await listsStore.editListDetails(
      props.list.id,
      values.name,
      values.details || '',
      isPublic.value
    );
    toast({
      title: `${props.list.name} updated`,
      description: `You have successfully updated ${props.list.name}.`,
      variant: 'success',
      duration: 3000,
    });
    isPopoverOpen.value = false;
  } catch (error) {
    toast({
      title: `Error`,
      description: `You have failed to update the details for ${props.list.name}: ${error}.`,
      variant: 'destructive',
      duration: 4000,
    });
  }
});
</script>

<template>
  <Popover v-model:open="isPopoverOpen">
    <PopoverTrigger as-child>
      <Button
        size="sm"
        class="hover:bg-goingTeal hover:text-white hover:border hover:border-goingTeal"
        :class="{
          'bg-white text-black': !darkModeStore.darkMode,
          'bg-gray-900 text-white border border-white': darkModeStore.darkMode,
        }"
      >
        <font-awesome-icon icon="fa-regular fa-pen-to-square" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-80" :auto-focus="false">
      <form @submit.prevent="onSubmit" class="grid gap-4">
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
        <Button type="submit">Save changes</Button>
      </form>
    </PopoverContent>
  </Popover>
</template>
