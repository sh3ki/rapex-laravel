import { Head, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { notify } from '@/lib/toast';

export default function RoleDashboard({ role }: { role: string }) {
    const page = usePage<{
        merchantOnboardingStatus?: string;
        merchantRejectionReason?: string;
    }>();
    const status = page.props.merchantOnboardingStatus;
    useEffect(() => {
        if (role === 'merchant' && status === 'pending') {
            notify.info('Your merchant application is pending review.');
        }
        if (role === 'merchant' && status === 'rejected') {
            notify.error(
                page.props.merchantRejectionReason ||
                    'Your merchant application requires changes.',
            );
        }
    }, [page.props.merchantRejectionReason, role, status]);
    return (
        <>
            <Head title={`${role} dashboard`} />
            <div className="space-y-4 p-6">
                <h1 className="text-2xl font-semibold">
                    {role[0].toUpperCase() + role.slice(1)} dashboard
                </h1>
                <p className="text-muted-foreground">
                    You are authenticated in the {role} context.
                </p>
            </div>
        </>
    );
}
