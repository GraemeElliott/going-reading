<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  FormInst,
  FormItemInst,
  FormItemRule,
  FormValidationError,
  useMessage,
  FormRules,
} from 'naive-ui';

import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/users';

const router = useRouter();
const userStore = useUserStore();

const isProcessing = ref(false);

interface ModelType {
  firstName: string | null;
  surname: string | null;
  username: string | null;
  email: string | null;
  password: string | null;
  reenteredPassword: string | null;
}

const initialModel: ModelType = {
  firstName: null,
  surname: null,
  username: null,
  email: null,
  password: null,
  reenteredPassword: null,
};

const model = ref<ModelType>({ ...initialModel });
const modelRef = ref<ModelType>({ ...initialModel });
const formRef = ref<FormInst | null>(null);
const rPasswordFormItemRef = ref<FormItemInst | null>(null);
const message = useMessage();

function validatePasswordStartWith(
  _rule: FormItemRule,
  value: string
): boolean {
  return (
    !!model.value.password &&
    model.value.password.startsWith(value) &&
    model.value.password.length >= value.length
  );
}

function validatePasswordSame(_rule: FormItemRule, value: string): boolean {
  return value === model.value.password;
}

const commonValidation = {
  required: true,
  trigger: ['input', 'blur'],
};

const rules: FormRules = {
  firstName: [
    {
      ...commonValidation,
      validator(_rule: FormItemRule, value: string) {
        if (!value) {
          return new Error('First name is required');
        }
        return true;
      },
    },
  ],
  surname: [
    {
      ...commonValidation,
      validator(_rule: FormItemRule, value: string) {
        if (!value) {
          return new Error('Surname is required');
        }
        return true;
      },
    },
  ],
  username: [
    {
      ...commonValidation,
      validator(_rule: FormItemRule, value: string) {
        if (!value) {
          return new Error('Username is required');
        }
        return true;
      },
    },
  ],
  email: [
    {
      ...commonValidation,
      validator(_rule: FormItemRule, value: string) {
        if (!value) {
          return new Error('Email is required');
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
          return new Error('Email should be a valid email address');
        }
        return true;
      },
    },
  ],
  password: [
    {
      ...commonValidation,
      validator(_rule: FormItemRule, value: string) {
        if (!value) {
          return new Error('Password is required');
        } else if (value.length < 6) {
          return new Error('Password should be at least 6 characters long');
        }
        return true;
      },
    },
  ],
  reenteredPassword: [
    {
      ...commonValidation,
      message: 'Re-entered password is required',
      trigger: ['input', 'blur'],
    },
    {
      validator: validatePasswordStartWith,
      message: 'Password is not same as re-entered password',
      trigger: 'input',
    },
    {
      validator: validatePasswordSame,
      message: 'Password is not same as re-entered password',
      trigger: ['blur', 'password-input'],
    },
  ],
};

const handlePasswordInput = () => {
  if (modelRef.value.reenteredPassword) {
    rPasswordFormItemRef.value?.validate({ trigger: 'password-input' });
  }
};

const isSubmitDisabled = computed(() => {
  const { firstName, surname, username, email, password, reenteredPassword } =
    model.value;
  return (
    firstName === null ||
    surname === null ||
    username === null ||
    email === null ||
    password === null ||
    reenteredPassword === null
  );
});

const handleSubmit = async () => {
  isProcessing.value = true;

  // Check if email is unique
  await userStore.checkEmailUniqueness(model.value.email);

  if (!userStore.isEmailUnique) {
    message.error('Email is already in use.');
    isProcessing.value = false;
  }

  // Check if username is unique
  await userStore.checkUsernameUniqueness(model.value.username);

  if (!userStore.isUsernameUnique) {
    message.error('Username is already in use.');
    isProcessing.value = false;
  }

  formRef.value?.validate(
    async (errors: Array<FormValidationError> | undefined) => {
      if (!errors && userStore.isEmailUnique && userStore.isUsernameUnique) {
        try {
          await userStore.registerUser({
            firstName: model.value.firstName || '',
            surname: model.value.surname || '',
            username: model.value.username || '',
            email: model.value.email || '',
            password: model.value.password || '',
          });
          message.success('Successfully registered');
          router.push('/sign-in');
        } catch {
          message.error('Registration failed. Please try again.');
        }
      } else {
        const flatErrors = (errors as Array<FormValidationError>).flat();
        flatErrors.map((err) => {
          message.error(err.message as string);
        });
      }
      isProcessing.value = false;
    }
  );
};
</script>

<template>
  <h1 class="mt-10 mb-10 text-center">Register</h1>
  <n-form
    @submit.prevent="handleSubmit"
    ref="formRef"
    :model="model"
    :rules="rules"
  >
    <div class="flex flex-row">
      <n-form-item path="firstName" label="First Name" class="w-1/2 mr-3">
        <n-input
          v-model:value="model.firstName"
          placeholder="First name"
          @keyup.enter="handleSubmit"
        />
      </n-form-item>
      <n-form-item path="surname" label="Surname" class="w-1/2">
        <n-input
          v-model:value="model.surname"
          placeholder="Surname"
          @keyup.enter="handleSubmit"
        />
      </n-form-item>
    </div>
    <n-form-item path="username" label="Username">
      <n-input
        v-model:value="model.username"
        placeholder="Username"
        @keyup.enter="handleSubmit"
      />
    </n-form-item>
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
        @input="handlePasswordInput"
        @keyup.enter="handleSubmit"
      />
    </n-form-item>
    <n-form-item
      ref="rPasswordFormItemRef"
      first
      path="reenteredPassword"
      label="Re-enter Password"
    >
      <n-input
        v-model:value="model.reenteredPassword"
        :disabled="!model.password"
        type="password"
        placeholder="Re-enter password"
        @keyup.enter="handleSubmit"
      />
    </n-form-item>
    <n-row :gutter="[0, 24]" class="flex flex-col">
      <n-col :span="24">
        <div style="display: flex; justify-content: center" class="mt-4">
          <n-button
            :disabled="isSubmitDisabled"
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
