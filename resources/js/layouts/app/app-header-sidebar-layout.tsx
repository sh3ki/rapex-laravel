import { AppHeader } from '@/components/app-header';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import type { AppLayoutProps } from '@/types';

export default function AppHeaderSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <div className="flex min-h-screen w-full flex-col">
            <AppSidebarLayout breadcrumbs={breadcrumbs}>
                {children}
            </AppSidebarLayout>
        </div>
    );
}
