import { Link, usePage } from '@inertiajs/react';
import { BriefcaseBusiness, ClipboardList, LayoutGrid, Settings, Store, UserRound, UsersRound } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { edit as editProfile } from '@/routes/profile';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

const dashboardHref = '/dashboard';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboardHref,
        icon: LayoutGrid,
    },
];

const accountNavItems: NavItem[] = [
    {
        title: 'Settings',
        href: editProfile(),
        icon: Settings,
        items: [
            {
            title: 'Profile',
            href: editProfile(),
            icon: UserRound,
            },
        ],
    },
];

const merchantManagementItems: NavItem[] = [
    {
        title: 'Merchant Management',
        href: '/merchant-management/applications',
        icon: BriefcaseBusiness,
        items: [
            {
                title: 'Merchant Applications',
                href: '/merchant-management/applications',
                icon: ClipboardList,
            },
            {
                title: 'Merchant Accounts',
                href: '/merchant-management/accounts',
                icon: UsersRound,
            },
        ],
    },
    {
        title: 'Store Management',
        href: '/store-management/classification',
        icon: Store,
        items: [
            {
                title: 'Store Applications',
                href: '/store-management/applications',
                icon: ClipboardList,
            },
            {
                title: 'Store Classification',
                href: '/store-management/classification',
                icon: Store,
            },
        ],
    },
];

const merchantOnboardingItems: NavItem[] = [
    {
        title: 'Onboarding',
        href: '/onboarding',
        icon: BriefcaseBusiness,
    },
];

const merchantStoreManagementItems: NavItem[] = [
    {
        title: 'Store Management',
        href: '/store-management/stores',
        icon: Store,
        items: [
            {
                title: 'Stores',
                href: '/store-management/stores',
                icon: Store,
            },
        ],
    },
];

export function AppSidebar() {
    const { role, auth } = usePage().props as {
        role?: string;
        auth?: { user?: { onboarding_admin_verified?: boolean } | null };
    };
    const merchantOnboardingRestricted =
        role === 'merchant' && auth?.user?.onboarding_admin_verified !== true;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link
                                href={
                                    merchantOnboardingRestricted
                                        ? '/onboarding'
                                        : dashboardHref
                                }
                                prefetch
                            >
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {merchantOnboardingRestricted ? (
                    <NavMain
                        items={merchantOnboardingItems}
                        groupLabel="Merchant Onboarding"
                    />
                ) : (
                    <>
                        <NavMain items={mainNavItems} />
                        {(role === 'admin' || role === 'superadmin') && (
                            <NavMain
                                items={merchantManagementItems}
                                groupLabel="Operations"
                            />
                        )}
                        {role === 'merchant' && (
                            <NavMain
                                items={merchantStoreManagementItems}
                                groupLabel="Operations"
                            />
                        )}
                        <NavMain items={accountNavItems} groupLabel="Account" />
                    </>
                )}
            </SidebarContent>
        </Sidebar>
    );
}
