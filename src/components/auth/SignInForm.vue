<script setup lang="ts">
import { ref } from 'vue';
import {
  FormInst,
  FormItemRule,
  FormValidationError,
  useMessage,
  FormRules,
} from 'naive-ui';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.ts';

const router = useRouter();

const { signIn } = useAuthStore();

interface ModelType {
  email: string | null;
  password: string | null;
}

const model = ref<ModelType>({
  email: null,
  password: null,
});

const formRef = ref<FormInst | null>(null);
const message = useMessage();

const rules: FormRules = {
  email: [
    {
      required: true,
      validator(_rule: FormItemRule, value: string) {
        if (!value) {
          return new Error('Email is required');
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
          return new Error('Email should be a valid email address');
        }
        return true;
      },
      trigger: ['input', 'blur'],
    },
  ],
  password: [
    {
      required: true,
      validator(_rule: FormItemRule, value: string) {
        if (!value) {
          return new Error('Password is required');
        } else if (value.length < 6) {
          return new Error('Password should be at least 6 characters long');
        }
        return true;
      },
      trigger: ['input', 'blur'],
    },
  ],
};

const handleSubmit = async () => {
  formRef.value?.validate(
    async (errors: Array<FormValidationError> | undefined) => {
      if (!errors) {
        const success = await signIn(model.value.email!, model.value.password!);

        if (success) {
          message.success('Successfully signed in');
          router.push('/');
        } else {
          message.error('Sign-in failed. Please try again.');
        }
      } else {
        const flatErrors = errors.flat();
        flatErrors.map((err) => {
          message.error(err.message as string);
        });
      }
    }
  );
};
</script>

<template>
  <h1 class="mt-10 mb-10 text-center">Sign In</h1>
  <n-form
    @submit.prevent="handleSubmit"
    ref="formRef"
    :model="model"
    :rules="rules"
  >
    <n-form-item path="email" label="Email">
      <n-input
        v-model:value="model.email"
        type="email"
        placeholder="Email"
        @keyup.enter="handleSubmit"
      />
    </n-form-item>

    <n-form-item path="password" label="Password">
      <n-input
        v-model:value="model.password"
        type="password"
        placeholder="Password"
        @keyup.enter="handleSubmit"
      />
    </n-form-item>
    <n-row :gutter="[0, 24]" class="flex flex-col">
      <n-col :span="24">
        <div style="display: flex; justify-content: center" class="mt-4">
          <n-button
            :disabled="model.email === null || model.password === null"
            type="info"
            @click="handleSubmit"
            @keyup.enter="handleSubmit"
          >
            Submit
          </n-button>
        </div>
      </n-col>
    </n-row>
  </n-form>
</template>
