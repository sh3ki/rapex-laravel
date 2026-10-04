import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
} from '@/components/ui/sidebar';
import { SidebarNavItem } from '@/components/sidebar-nav-item';
import type { NavItem } from '@/types';

export function NavMain({
    items,
    groupLabel = 'Platform',
}: {
    items: NavItem[];
    groupLabel?: string;
}) {
    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarNavItem key={item.title} item={item} />
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
