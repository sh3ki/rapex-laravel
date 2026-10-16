import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

const SIDEBAR_NAV_STATE_KEY = 'rapex-sidebar-nav-state';

function readSidebarNavState(): Record<string, boolean> {
    if (typeof window === 'undefined') {
        return {};
    }

    try {
        const stored = window.localStorage.getItem(SIDEBAR_NAV_STATE_KEY);

        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

function writeSidebarNavState(key: string, open: boolean) {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        const state = readSidebarNavState();
        state[key] = open;
        window.localStorage.setItem(SIDEBAR_NAV_STATE_KEY, JSON.stringify(state));
    } catch {
        // Storage may be unavailable in private browsing or when disabled.
    }
}

export function SidebarNavItem({ item }: { item: NavItem }) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const hasChildren = Boolean(item.items?.length);
    const isActive =
        item.isActive ||
        isCurrentOrParentUrl(item.href) ||
        item.items?.some((child) => isCurrentOrParentUrl(child.href));

    if (!hasChildren) {
        return (
            <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    isActive={Boolean(isActive)}
                    tooltip={{ children: item.title }}
                >
                    <Link href={item.href} prefetch>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        );
    }

    return (
        <SidebarNavItemWithChildren item={item} isActive={Boolean(isActive)} />
    );
}

function SidebarNavItemWithChildren({
    item,
    isActive,
}: {
    item: NavItem;
    isActive: boolean;
}) {
    const { isCurrentUrl } = useCurrentUrl();
    const storageKey = String(item.href);
    const [open, setOpen] = useState(true);
    const [hasLoadedStoredState, setHasLoadedStoredState] = useState(false);

    useEffect(() => {
        const storedState = readSidebarNavState();

        if (typeof storedState[storageKey] === 'boolean') {
            setOpen(storedState[storageKey]);
        }

        setHasLoadedStoredState(true);
    }, [storageKey]);

    useEffect(() => {
        if (hasLoadedStoredState) {
            writeSidebarNavState(storageKey, open);
        }
    }, [hasLoadedStoredState, open, storageKey]);

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
            className="group/collapsible"
        >
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                        isActive={isActive}
                        tooltip={{ children: item.title }}
                    >
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        {item.items?.map((child) => (
                            <SidebarMenuSubItem key={child.title}>
                                <SidebarMenuSubButton
                                    asChild
                                    isActive={isCurrentUrl(child.href)}
                                >
                                    <Link href={child.href} prefetch>
                                        {child.icon && <child.icon />}
                                        <span>{child.title}</span>
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
}
