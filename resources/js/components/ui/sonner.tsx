import { useFlashToast } from '@/hooks/use-flash-toast';
import { useAppearance } from '@/hooks/use-appearance';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
    const { appearance } = useAppearance();

    useFlashToast();

    return (
        <Sonner
            theme={appearance}
            className="toaster group"
            position="top-right"
            expand
            closeButton
            duration={4000}
            offset={16}
            style={
                {
                    zIndex: 2147483647,
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                } as React.CSSProperties
            }
            toastOptions={{
                duration: 4000,
                classNames: {
                    toast: 'group/toast border shadow-lg',
                    success: 'border-emerald-500/40',
                    error: 'border-destructive/50',
                    warning: 'border-amber-500/50',
                    info: 'border-blue-500/40',
                },
            }}
            {...props}
        />
    );
}

export { Toaster };
