import { useState, useCallback } from 'react';

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidation {
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  validateField: (name: string, value: string, rules?: ValidationRules) => string | null;
  validateStep: (step: number, formData: Record<string, unknown>) => boolean;
  setFieldTouched: (name: string) => void;
  setFieldError: (name: string, error: string) => void;
  clearFieldError: (name: string) => void;
  clearErrors: () => void;
  getFieldError: (name: string) => string | null;
  isFieldValid: (name: string) => boolean;
}

interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
}

const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

export function useFormValidation(): FormValidation {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((name: string, value: string, rules?: ValidationRules): string | null => {
    if (!rules) return null;

    if (rules.required && (!value || value.trim().length === 0)) {
      return 'This field is required';
    }

    if (rules.minLength && value.length < rules.minLength) {
      return `Must be at least ${rules.minLength} characters`;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return `Must be less than ${rules.maxLength} characters`;
    }

    if (rules.email && value && !emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }

    if (rules.phone && value && !phoneRegex.test(value.replace(/\s/g, ''))) {
      return 'Please enter a valid phone number';
    }

    if (rules.pattern && value && !rules.pattern.test(value)) {
      return 'Invalid format';
    }

    return null;
  }, []);

  const setFieldTouched = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const setFieldError = useCallback((name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const clearFieldError = useCallback((name: string) => {
    setErrors(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const getFieldError = useCallback((name: string): string | null => {
    return touched[name] ? errors[name] || null : null;
  }, [errors, touched]);

  const isFieldValid = useCallback((name: string): boolean => {
    return touched[name] && !errors[name];
  }, [errors, touched]);

  const validateStep = useCallback((step: number, formData: Record<string, unknown>): boolean => {
    const newErrors: Record<string, string> = {};
    
    const validationRules: Record<number, Record<string, ValidationRules>> = {
      1: {
        firstName: { required: true, minLength: 2, maxLength: 50 },
        lastName: { required: true, minLength: 2, maxLength: 50 },
        email: { required: true, email: true },
        phone: { phone: true },
      },
      2: {
        businessName: { required: true, minLength: 2, maxLength: 100 },
        businessType: { required: true },
      },
      3: {
        selectedPackage: { required: true },
      },
      4: {
        primaryGoal: { required: true },
      },
      5: {
        projectDescription: { required: true, minLength: 20, maxLength: 5000 },
      },
    };

    const stepRules = validationRules[step] || {};
    let isValid = true;

    Object.entries(stepRules).forEach(([field, rules]) => {
      const value = String(formData[field] || '');
      const error = validateField(field, value, rules);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    // Mark all fields as touched for this step
    const newTouched: Record<string, boolean> = { ...touched };
    Object.keys(stepRules).forEach(field => {
      newTouched[field] = true;
    });

    setErrors(prev => ({ ...prev, ...newErrors }));
    setTouched(newTouched);

    return isValid;
  }, [validateField, touched]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return {
    errors,
    touched,
    validateField,
    validateStep,
    setFieldTouched,
    setFieldError,
    clearFieldError,
    clearErrors,
    getFieldError,
    isFieldValid,
  };
}
