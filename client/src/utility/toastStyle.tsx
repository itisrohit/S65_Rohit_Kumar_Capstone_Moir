import { toast } from "sonner";
import React from "react";

type ToastOptions = Parameters<typeof toast>[1];

const formatErrorMessage = (error: string) => {
  return <span style={{ color: "#b91c1c", fontWeight: 500 }}>{error}</span>;
};

const formatSuccessMessage = (message: string) => {
  return <span style={{ color: "#047857", fontWeight: 500 }}>{message}</span>;
};

const formatWarningMessage = (message: string) => {
  return <span style={{ color: "#9a3412", fontWeight: 500 }}>{message}</span>;
};

const formatInfoMessage = (message: string) => {
  return <span style={{ color: "#2563eb", fontWeight: 500 }}>{message}</span>;
};

const toastStyles = {
  success: {
    style: {
      color: "#065f46", 
      backgroundColor: "#ecfdf5", 
      border: "1px solid #10b981",
      fontWeight: 500,
    }
  },
  error: {
    style: {
      color: "#991b1b", 
      backgroundColor: "#fef2f2", 
      border: "1px solid #ef4444",
      fontWeight: 500,
    }
  },
  warning: {
    style: {
      color: "#7c2d12", 
      backgroundColor: "#fff7ed", 
      border: "1px solid #f97316",
      fontWeight: 500,
    }
  },
  info: {
    style: {
      color: "#1e40af", 
      backgroundColor: "#eff6ff", 
      border: "1px solid #3b82f6",
      fontWeight: 500,
    }
  }
};

// Apply formatted descriptions to all toast types
export const toastSuccess = (message: string, options?: ToastOptions & { description?: React.ReactNode | string }) => {
  if (options?.description && typeof options.description === 'string') {
    options = {
      ...options,
      description: formatSuccessMessage(options.description as string)
    };
  }
  return toast.success(message, { ...toastStyles.success, ...options });
};

export const toastError = (message: string, options?: ToastOptions & { description?: React.ReactNode | string }) => {
  if (options?.description && typeof options.description === 'string') {
    options = {
      ...options,
      description: formatErrorMessage(options.description as string)
    };
  }
  return toast.error(message, { ...toastStyles.error, ...options });
};

export const toastWarning = (message: string, options?: ToastOptions & { description?: React.ReactNode | string }) => {
  if (options?.description && typeof options.description === 'string') {
    options = {
      ...options,
      description: formatWarningMessage(options.description as string)
    };
  }
  return toast.warning(message, { ...toastStyles.warning, ...options });
};

export const toastInfo = (message: string, options?: ToastOptions & { description?: React.ReactNode | string }) => {
  if (options?.description && typeof options.description === 'string') {
    options = {
      ...options,
      description: formatInfoMessage(options.description as string)
    };
  }
  return toast.info(message, { ...toastStyles.info, ...options });
};