<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useListsStore } from '@/store/lists-store';
import { useDarkModeStore } from '@/store/store';
import { useForm, useField } from 'vee-validate';
import { listDetailsFormSchema } from '@/store/form-validation-schemas';
import type { List } from '@/types/list';
import { toast } from '@/components/ui/toast';

const props = defineProps<{
  list: List;
}>();

const emit = defineEmits<{
  (e: 'done'): void;
}>();

const listsStore = useListsStore();
const darkModeStore = useDarkModeStore();
const saving = ref(false);

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

const onSubmit = handleSubmit(async (values) => {
  saving.value = true;
  try {
    await listsStore.editListDetails(
      props.list.id,
      values.name,
      values.details || ''
    );
    toast({
      title: `${values.name} updated`,
      description: `You have successfully updated ${values.name}.`,
      variant: 'success',
      duration: 3000,
    });
    emit('done');
  } catch (error) {
    toast({
      title: `Error`,
      description: `You have failed to update the details for ${props.list.name}: ${error}.`,
      variant: 'destructive',
      duration: 4000,
    });
  } finally {
    saving.value = false;
  }
});
</script>

<template>
  <form
    @submit.prevent="onSubmit"
    class="grid gap-3"
    :class="darkModeStore.darkMode ? 'form-dark' : 'form-light'"
  >
    <div class="grid gap-1.5">
      <label for="edit-list-name" class="text-sm font-medium">Name</label>
      <Input id="edit-list-name" v-model="nameValue" placeholder="List name" />
      <span v-if="nameError" class="text-sm text-red-500">{{ nameError }}</span>
    </div>
    <div class="grid gap-1.5">
      <label for="edit-list-details" class="text-sm font-medium">Details</label>
      <Textarea
        id="edit-list-details"
        v-model="detailsValue"
        placeholder="Add some details about your list..."
        rows="2"
      />
      <span v-if="detailsError" class="text-sm text-red-500">{{
        detailsError
      }}</span>
    </div>
    <div class="flex justify-end gap-2">
      <Button
        type="button"
        class="bg-black text-white flex-1 sm:flex-none sm:w-[180px]"
        @click="emit('done')"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        class="bg-goingGreen text-white hover:bg-goingGreen/90 flex-1 sm:flex-none sm:w-[180px]"
        :disabled="saving"
      >
        {{ saving ? 'Saving...' : 'Save changes' }}
      </Button>
    </div>
  </form>
</template>
<style scoped>
.form-light :deep(input),
.form-light :deep(textarea) {
  @apply bg-white text-black !important;
}
.form-dark :deep(input),
.form-dark :deep(textarea) {
  @apply bg-white/5 backdrop-blur-sm text-white border-gray-600 placeholder:text-gray-500 !important;
}
</style>
