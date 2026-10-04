import { toast } from 'sonner';
import type { FlashToast, ToastType } from '@/types/ui';

export type ToastOptions = {
    id?: string | number;
    duration?: number;
};

/** The single application-facing API for transient user feedback. */
export const notify = {
    show({ type, message }: FlashToast, options?: ToastOptions) {
        toast[type](message, { duration: 4000, ...options });
    },
    success(message: string, options?: ToastOptions) {
        toast.success(message, { duration: 4000, ...options });
    },
    error(message: string, options?: ToastOptions) {
        toast.error(message, { duration: 4000, ...options });
    },
    info(message: string, options?: ToastOptions) {
        toast.info(message, { duration: 4000, ...options });
    },
    warning(message: string, options?: ToastOptions) {
        toast.warning(message, { duration: 4000, ...options });
    },
    dismiss(id?: string | number) {
        toast.dismiss(id);
    },
};

export type { ToastType };
