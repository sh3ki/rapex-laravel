import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { notify } from '@/lib/toast';
import type { FlashToast } from '@/types/ui';

export function useFlashToast(): void {
    useEffect(() => {
        const removeFlash = router.on('flash', (event) => {
            const data = event.detail.flash?.toast as FlashToast | undefined;
            if (data) notify.show(data);
        });
        const removeNavigate = router.on('navigate', (event) => {
            const flash = event.detail.page.props.flash as {
                status?: string;
            } | undefined;
            if (flash?.status) notify.info(flash.status);
        });
        const removeError = router.on('error', (event) => {
            const errors = Object.values(event.detail.errors).filter(
                (value): value is string => typeof value === 'string',
            );
            const message = errors[0] || 'Please correct the errors and try again.';
            notify.error(message);
        });
        const removeHttpException = router.on('httpException', (event) => {
            notify.error(
                event.detail.response.status >= 500
                    ? 'Something went wrong on the server. Please try again.'
                    : 'The request could not be completed.',
            );
        });
        const removeNetworkError = router.on('networkError', () => {
            notify.error('Network error. Please check your connection and try again.');
        });

        return () => {
            removeFlash();
            removeNavigate();
            removeError();
            removeHttpException();
            removeNetworkError();
        };
    }, []);
}
