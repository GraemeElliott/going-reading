<script setup lang="ts">
import { ref } from 'vue';
import { useListsStore } from '@/store/lists-store';
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
  <form @submit.prevent="onSubmit" class="grid gap-4">
    <div class="grid gap-2">
      <label for="edit-list-name" class="text-[15px] font-semibold">Name</label>
      <input
        id="edit-list-name"
        v-model="nameValue"
        type="text"
        class="gr-input h-12"
        placeholder="List name"
        :aria-invalid="!!nameError"
      />
      <span v-if="nameError" class="text-sm text-gr-danger-text">{{
        nameError
      }}</span>
    </div>
    <div class="grid gap-2">
      <label for="edit-list-details" class="text-[15px] font-semibold">
        Details <span class="font-normal text-gr-muted">(optional)</span>
      </label>
      <textarea
        id="edit-list-details"
        v-model="detailsValue"
        rows="3"
        class="gr-input h-auto py-2.5"
        placeholder="Add some details about your list"
        :aria-invalid="!!detailsError"
      ></textarea>
      <span v-if="detailsError" class="text-sm text-gr-danger-text">{{
        detailsError
      }}</span>
    </div>
    <div class="flex justify-end gap-2">
      <button type="button" class="gr-btn gr-btn-outline" @click="emit('done')">
        Cancel
      </button>
      <button type="submit" class="gr-btn gr-btn-accent" :disabled="saving">
        {{ saving ? 'Saving...' : 'Save changes' }}
      </button>
    </div>
  </form>
</template>
