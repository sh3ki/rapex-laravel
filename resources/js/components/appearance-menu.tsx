import { Monitor, Moon, Sun } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAppearance, type Appearance } from '@/hooks/use-appearance';

const appearanceLabels: Record<Appearance, string> = {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
};

export function AppearanceMenu() {
    const { appearance, updateAppearance } = useAppearance();
    const Icon = appearance === 'light' ? Sun : appearance === 'dark' ? Moon : Monitor;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 rounded-full p-0"
                    aria-label={`Theme: ${appearanceLabels[appearance]}`}
                    data-test="appearance-menu-button"
                >
                    <Icon className="size-4" />
                    <span className="sr-only">Choose appearance</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                    value={appearance}
                    onValueChange={(value) => updateAppearance(value as Appearance)}
                >
                    <DropdownMenuRadioItem value="light">
                        <Sun className="size-4" />
                        Light
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">
                        <Moon className="size-4" />
                        Dark
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">
                        <Monitor className="size-4" />
                        System
                    </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
