// src/utils/validationSchemas.ts
import * as yup from 'yup';

const passwordRules = yup
  .string()
  .min(6, 'Password must be at least 6 characters')
  .required('Password is required');

export const loginSchema = yup.object({
  email:    yup.string().email('Invalid email').required('Email is required'),
  password: passwordRules,
});

export const registerSchema = yup.object({
  username:       yup.string().required('Username is required'),
  email:          yup.string().email('Invalid email').required('Email is required'),
  password:       passwordRules,
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});
