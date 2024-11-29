import * as z from 'zod';
import { toTypedSchema } from '@vee-validate/zod';

// Register form validation schema using Zod
export const rawSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters.')
      .max(30, 'First name can have a maximum of 30 characters.'),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters.')
      .max(30, 'Last name can have a maximum of 30 characters.'),
    username: z
      .string()
      .min(5, 'Username must be at least 5 characters.')
      .max(20, 'Username can have a maximum of 30 characters.')
      .regex(
        /^[a-zA-Z0-9]+$/,
        'Username must contain only letters and numbers.'
      ),
    email: z.string().email('Invalid email address.'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters.')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
      .regex(/[\W_]/, 'Password must contain at least one special character.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match.',
    path: ['confirmPassword'],
  });

export const registerFormSchema = toTypedSchema(rawSchema);

// Sign-In Form Schema
export const signInFormSchema = toTypedSchema(
  z.object({
    email: z.string().email('Invalid email address.'),
    password: z.string(),
  })
);

// Account Update Form Schema
export const accountFormSchema = toTypedSchema(
  z.object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters.')
      .max(30, 'First name can have a maximum of 30 characters.'),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters.')
      .max(30, 'Last name can have a maximum of 30 characters.'),
    username: z
      .string()
      .min(5, 'Username must be at least 5 characters.')
      .max(20, 'Username can have a maximum of 30 characters.')
      .regex(
        /^[a-zA-Z0-9]+$/,
        'Username must contain only letters and numbers.'
      ),
    email: z.string().email('Invalid email address.'),
    bio: z
      .string()
      .max(160, { message: 'Bio must not be longer than 160 characters.' })
      .optional()
      .refine((value) => !value || value.length >= 4, {
        message: 'Bio must be at least 4 characters if provided.',
      }),
  })
);

// Password Update Form Schema
export const passwordFormSchema = toTypedSchema(
  z
    .object({
      password: z
        .string()
        .min(6, 'Password must be at least 6 characters.')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
        .regex(
          /[\W_]/,
          'Password must contain at least one special character.'
        ),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords must match.',
      path: ['confirmPassword'],
    })
);

// List Details Form Schema
export const listDetailsFormSchema = toTypedSchema(
  z.object({
    name: z
      .string()
      .min(3, 'List name must be at least 3 characters.')
      .max(30, 'List name can have a maximum of 30 characters.'),
    details: z
      .string()
      .max(150, 'Details can have a maximum of 150 characters.')
      .optional(),
  })
);

// Update Progress Form Schema
export const updateProgressSchema = toTypedSchema(
  z.object({
    currentPage: z
      .number({
        required_error: 'Please enter the current page number',
        invalid_type_error: 'Current page must be a number',
      })
      .min(0, 'Current page must be 0 or greater'),
    timeReadingInMins: z
      .number({
        required_error: 'Please enter the time spent reading',
        invalid_type_error: 'Time must be a number',
      })
      .min(0, 'Time must be 0 or greater')
      .max(1440, 'Time cannot exceed 1,440 minutes'),
  })
);
