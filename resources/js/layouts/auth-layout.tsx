import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';
import MerchantLoginLayout from '@/layouts/auth/merchant-login-layout';
import { usePage } from '@inertiajs/react';

export default function AuthLayout({
    title = '',
    description = '',
    children,
}: {
    title?: string;
    description?: string;
    children: React.ReactNode;
}) {
    const { props } = usePage<{ role?: string }>();
    if (props.role === 'merchant' && typeof window !== 'undefined' && window.location.pathname === '/login') {
        return <MerchantLoginLayout>{children}</MerchantLoginLayout>;
    }

    return (
        <AuthLayoutTemplate title={title} description={description}>
            {children}
        </AuthLayoutTemplate>
    );
}
