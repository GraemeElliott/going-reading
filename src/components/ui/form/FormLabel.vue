<script lang="ts" setup>
import type { HTMLAttributes } from 'vue';
import type { LabelProps } from 'radix-vue';
import { useFormField } from './useFormField';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const props = defineProps<
  LabelProps & { class?: HTMLAttributes['class']; required?: boolean }
>();

const { error, formItemId } = useFormField();
</script>

<template>
  <Label
    :class="cn(error && 'text-destructive', props.class)"
    :for="formItemId"
  >
    <slot />
    <!-- Add an asterisk if the field is required -->
    <span v-if="props.required" class="text-red-500 ml-1">*</span>
  </Label>
</template>
