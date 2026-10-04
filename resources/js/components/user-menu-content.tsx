import { Link } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
import {
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import type { User } from '@/types';

type Props = {
    user: User;
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();

    const handleLogout = () => {
        cleanup();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="bg-red-50 text-red-700 hover:bg-red-50 focus:bg-red-50 focus:text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/40 dark:focus:bg-red-950/40 dark:focus:text-red-300">
                <Link
                    className="block w-full cursor-pointer text-inherit"
                    href="/logout"
                    method="post"
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2 text-red-600 dark:text-red-400" />
                    Log out
                </Link>
            </DropdownMenuItem>
        </>
    );
}
